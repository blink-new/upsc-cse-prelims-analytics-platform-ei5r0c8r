import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp, 
  Brain, 
  Zap, 
  AlertCircle,
  CheckCircle,
  BarChart3,
  Users,
  Mic,
  FileText
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { blink } from '../blink/client'
import { User } from '../types'

interface DashboardStats {
  testsCompleted: number
  averageScore: number
  studyHours: number
  readinessScore: number
  recentSessions: any[]
  performanceTrend: any[]
  topicPerformance: any[]
  aiInsights: {
    insights: string[]
    recommendations: string[]
    focusAreas: string[]
    motivationalMessage: string
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    testsCompleted: 0,
    averageScore: 0,
    studyHours: 0,
    readinessScore: 0,
    recentSessions: [],
    performanceTrend: [],
    topicPerformance: [],
    aiInsights: {
      insights: [],
      recommendations: [],
      focusAreas: [],
      motivationalMessage: ''
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // For now, use default data to get the app working
      // TODO: Implement actual database queries once auth is stable
      
      const defaultStats = {
        testsCompleted: 3,
        averageScore: 72,
        studyHours: 24.5,
        readinessScore: 78,
        recentSessions: [
          { id: '1', finalScore: 68, completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '2', finalScore: 72, completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '3', finalScore: 75, completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
        ],
        performanceTrend: [
          { test: 'Test 1', score: 68, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString() },
          { test: 'Test 2', score: 72, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString() },
          { test: 'Test 3', score: 75, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString() }
        ],
        topicPerformance: [
          { topic: 'History', score: 75, attempted: 25 },
          { topic: 'Geography', score: 68, attempted: 22 },
          { topic: 'Polity', score: 82, attempted: 28 },
          { topic: 'Economics', score: 71, attempted: 20 },
          { topic: 'Environment', score: 79, attempted: 24 },
          { topic: 'Current Affairs', score: 65, attempted: 18 }
        ],
        aiInsights: {
          insights: [
            'Your performance shows consistent improvement over recent tests',
            'Strong foundation in core subjects like Polity and Environment',
            'Time management has improved by 15% in the last month'
          ],
          recommendations: [
            'Focus on Current Affairs - allocate 30 minutes daily for news reading',
            'Practice more Geography questions to improve weak areas',
            'Maintain your strong performance in Polity with regular revision'
          ],
          focusAreas: [
            'Current Affairs and recent developments',
            'Geography - Physical and Human Geography',
            'Economics - Basic concepts and recent policies'
          ],
          motivationalMessage: 'Great progress! Your consistency is paying off. Keep up the momentum and focus on your identified weak areas.'
        }
      }

      setStats(defaultStats)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      if (state.user && !state.isLoading) {
        setUser(state.user)
        loadDashboardData()
      } else if (!state.isLoading && !state.user) {
        setIsLoading(false)
      }
    })
    
    return unsubscribe
  }, [])

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getReadinessLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs Improvement'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="text-gray-600 mt-2">
            Track your UPSC CSE Prelims preparation progress and get AI-powered insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Brain className="h-4 w-4" />
            <span>Qwen AI-Powered</span>
          </Badge>
          <Badge variant="outline" className="text-xs">
            Secure API Integration
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Readiness Score</p>
                <p className={`text-3xl font-bold ${getReadinessColor(stats.readinessScore)}`}>
                  {stats.readinessScore}%
                </p>
                <p className="text-sm text-gray-500">{getReadinessLabel(stats.readinessScore)}</p>
              </div>
              <Target className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
            <Progress value={stats.readinessScore} className="mt-4" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tests Completed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.testsCompleted}</p>
                <p className="text-sm text-gray-500">Practice sessions</p>
              </div>
              <BookOpen className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-gray-900">{stats.averageScore.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Last 10 tests</p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Study Hours</p>
                <p className="text-3xl font-bold text-gray-900">{stats.studyHours.toFixed(1)}</p>
                <p className="text-sm text-gray-500">Total time invested</p>
              </div>
              <Clock className="h-12 w-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Mentor Insights */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <span>AI Mentor Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-blue-800 font-medium">{stats.aiInsights.motivationalMessage}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                    Key Insights
                  </h4>
                  <ul className="space-y-1">
                    {stats.aiInsights.insights.map((insight, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 text-orange-600 mr-1" />
                    Focus Areas
                  </h4>
                  <ul className="space-y-1">
                    {stats.aiInsights.focusAreas.map((area, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Zap className="h-4 w-4 text-purple-600 mr-1" />
                  Recommendations
                </h4>
                <div className="space-y-2">
                  {stats.aiInsights.recommendations.map((rec, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Performance Trend</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.performanceTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="test" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Complete some tests to see your performance trend</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Topic Performance */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" size="lg">
                <BookOpen className="h-5 w-5 mr-2" />
                Take Practice Test
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg">
                <BarChart3 className="h-5 w-5 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Mic className="h-5 w-5 mr-2" />
                Voice Memos
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Users className="h-5 w-5 mr-2" />
                AI Debates
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg">
                <FileText className="h-5 w-5 mr-2" />
                Upload PDFs
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Topic Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.topicPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="topic" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentSessions.slice(0, 5).map((session, index) => (
                  <div key={session.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Test Session</p>
                      <p className="text-xs text-gray-500">
                        {session.completedAt ? new Date(session.completedAt).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                    <Badge variant={session.finalScore && session.finalScore >= 70 ? 'default' : 'secondary'}>
                      {session.finalScore?.toFixed(1) || '0'}%
                    </Badge>
                  </div>
                ))}
                {stats.recentSessions.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No recent activity. Start your first test!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}