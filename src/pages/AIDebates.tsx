import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Users, Zap, Brain, Play, Pause } from 'lucide-react'
import { supabase, AIDebate } from '@/lib/supabase'
import { aiService } from '@/lib/ai'

interface DebateMessage {
  id: string
  speaker: 'persona_a' | 'persona_b' | 'user'
  content: string
  timestamp: string
}

export default function AIDebates() {
  const [debates, setDebates] = useState<AIDebate[]>([])
  const [activeDebate, setActiveDebate] = useState<AIDebate | null>(null)
  const [messages, setMessages] = useState<DebateMessage[]>([])
  const [newTopic, setNewTopic] = useState('')
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDebateActive, setIsDebateActive] = useState(false)

  const loadDebates = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data, error } = await supabase
        .from('ai_debates')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDebates(data || [])
    } catch (error) {
      console.error('Error loading debates:', error)
    }
  }

  useEffect(() => {
    loadDebates()
  }, [])

  const createNewDebate = async () => {
    if (!newTopic.trim()) return

    try {
      setIsLoading(true)
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Generate initial stances using AI
      const context = `Current affairs topic: ${newTopic}`
      const personaAStance = await aiService.generateDebateResponse(newTopic, 'A', [], context)
      const personaBStance = await aiService.generateDebateResponse(newTopic, 'B', [], context)

      const { data, error } = await supabase
        .from('ai_debates')
        .insert({
          user_id: user.user.id,
          topic: newTopic,
          debate_context: context,
          persona_a_stance: personaAStance,
          persona_b_stance: personaBStance,
          conversation: [],
          user_interactions: [],
          learning_outcomes: []
        })
        .select()
        .single()

      if (error) throw error

      setActiveDebate(data)
      setMessages([])
      setNewTopic('')
      setIsDebateActive(true)
      loadDebates()
    } catch (error) {
      console.error('Error creating debate:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startDebateRound = async () => {
    if (!activeDebate) return

    try {
      setIsLoading(true)
      
      // Persona A speaks first
      const personaAResponse = await aiService.generateDebateResponse(
        activeDebate.topic || '',
        'A',
        messages,
        activeDebate.debate_context || ''
      )

      const messageA: DebateMessage = {
        id: `msg_${Date.now()}_a`,
        speaker: 'persona_a',
        content: personaAResponse,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, messageA])

      // Wait a moment, then Persona B responds
      setTimeout(async () => {
        const personaBResponse = await aiService.generateDebateResponse(
          activeDebate.topic || '',
          'B',
          [...messages, messageA],
          activeDebate.debate_context || ''
        )

        const messageB: DebateMessage = {
          id: `msg_${Date.now()}_b`,
          speaker: 'persona_b',
          content: personaBResponse,
          timestamp: new Date().toISOString()
        }

        setMessages(prev => [...prev, messageB])
        
        // Update debate in database
        const updatedConversation = [...messages, messageA, messageB]
        await supabase
          .from('ai_debates')
          .update({ 
            conversation: updatedConversation,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeDebate.id)

        setIsLoading(false)
      }, 2000)
    } catch (error) {
      console.error('Error in debate round:', error)
      setIsLoading(false)
    }
  }

  const addUserInput = async () => {
    if (!userInput.trim() || !activeDebate) return

    const userMessage: DebateMessage = {
      id: `msg_${Date.now()}_user`,
      speaker: 'user',
      content: userInput,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setUserInput('')

    // Update user interactions
    const updatedInteractions = [...(activeDebate.user_interactions || []), userMessage]
    await supabase
      .from('ai_debates')
      .update({ user_interactions: updatedInteractions })
      .eq('id', activeDebate.id)
  }

  const selectDebate = (debate: AIDebate) => {
    setActiveDebate(debate)
    setMessages(debate.conversation || [])
    setIsDebateActive(true)
  }

  const currentAffairsTopics = [
    'Digital India Initiative Impact',
    'Climate Change Policy Measures',
    'Economic Recovery Post-Pandemic',
    'Education System Reforms',
    'Healthcare Infrastructure Development',
    'Agricultural Modernization',
    'Urban Planning and Smart Cities',
    'Renewable Energy Transition'
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Policy Debates</h1>
          <p className="text-gray-600 mt-2">
            Engage with dual AI personas debating current affairs topics to understand multiple perspectives
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Brain className="h-4 w-4" />
            <span>AI-Powered</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Debate Creation & History */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Start New Debate</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Enter Topic or Select Below
                </label>
                <Input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g., Should India prioritize renewable energy?"
                  className="mb-3"
                />
                <Button 
                  onClick={createNewDebate} 
                  disabled={!newTopic.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Creating...' : 'Start AI Debate'}
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Quick Topics
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {currentAffairsTopics.map((topic, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setNewTopic(topic)}
                      className="text-left justify-start h-auto py-2 px-3"
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Recent Debates</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {debates.map((debate) => (
                  <div
                    key={debate.id}
                    onClick={() => selectDebate(debate)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm">{debate.topic}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(debate.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {debates.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No debates yet. Start your first debate!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Debate Interface */}
        <div className="lg:col-span-2">
          {activeDebate ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center justify-between">
                  <span>{activeDebate.topic}</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={startDebateRound}
                      disabled={isLoading}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      {isLoading ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      <span>{isLoading ? 'Debating...' : 'Next Round'}</span>
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Debate Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.speaker === 'persona_a'
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : message.speaker === 'persona_b'
                          ? 'bg-red-50 border-l-4 border-red-500'
                          : 'bg-green-50 border-l-4 border-green-500'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge
                          variant={
                            message.speaker === 'persona_a'
                              ? 'default'
                              : message.speaker === 'persona_b'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {message.speaker === 'persona_a'
                            ? 'Pro Stance'
                            : message.speaker === 'persona_b'
                            ? 'Counter Stance'
                            : 'Your Input'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-800 leading-relaxed">{message.content}</p>
                    </div>
                  ))}
                  
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Click "Next Round" to start the AI debate!</p>
                    </div>
                  )}
                </div>

                {/* User Input */}
                <div className="flex-shrink-0 space-y-2">
                  <Textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Add your perspective or ask questions..."
                    className="min-h-[80px]"
                  />
                  <Button
                    onClick={addUserInput}
                    disabled={!userInput.trim()}
                    className="w-full"
                  >
                    Add Your Input
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Active Debate</h3>
                <p>Start a new debate or select from your recent debates to begin</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}