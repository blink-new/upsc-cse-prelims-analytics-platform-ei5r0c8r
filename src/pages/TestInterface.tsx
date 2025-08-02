import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Clock, 
  Flag, 
  SkipForward, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import { Slider } from '../components/ui/slider'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group'
import { Label } from '../components/ui/label'
import { blink } from '../blink/client'
import { Question, QuestionAttempt } from '../types'
import VoiceMemoTrigger from '../components/VoiceMemoTrigger'

export default function TestInterface() {
  const [isTestActive, setIsTestActive] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [confidenceLevels, setConfidenceLevels] = useState<Record<string, number>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState(7200) // 2 hours in seconds
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({})
  const [sessionId, setSessionId] = useState<string>('')
  const [isTestCompleted, setIsTestCompleted] = useState(false)
  const [showVoiceMemoTrigger, setShowVoiceMemoTrigger] = useState(false)
  const [voiceMemoQuestionId, setVoiceMemoQuestionId] = useState<string>('')
  const [voiceMemoAttemptId, setVoiceMemoAttemptId] = useState<string>('')
  const [voiceMemoIsCorrect, setVoiceMemoIsCorrect] = useState(false)
  const [voiceMemoConfidence, setVoiceMemoConfidence] = useState(3)
  
  const timerRef = useRef<NodeJS.Timeout>()

  const loadQuestions = async () => {
    try {
      const questionsData = await blink.db.questions.list({
        limit: 100,
        orderBy: { createdAt: 'asc' }
      })
      setQuestions(questionsData)
    } catch (error) {
      console.error('Failed to load questions:', error)
    }
  }

  const handleSubmitTest = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      let correctAnswers = 0
      let totalAttempted = 0
      let negativeMarks = 0

      // Calculate scores and save attempts
      for (const question of questions) {
        const userAnswer = answers[question.id]
        if (userAnswer) {
          totalAttempted++
          const isCorrect = userAnswer === question.correctAnswer
          if (isCorrect) {
            correctAnswers++
          } else {
            negativeMarks += 1/3 // 1/3 negative marking
          }

          // Save question attempt
          await blink.db.question_attempts.create({
            id: `attempt_${Date.now()}_${question.id}`,
            userId: user.id,
            sessionId: sessionId,
            questionId: question.id,
            selectedAnswer: userAnswer,
            isCorrect: isCorrect ? 1 : 0,
            confidenceLevel: confidenceLevels[question.id] || 3,
            timeTakenSeconds: questionTimes[question.id] || 60,
            optionChanges: 0,
            wasSkipped: 0,
            wasReturnedTo: 0,
            attemptOrder: questions.indexOf(question) + 1,
            createdAt: new Date().toISOString()
          })
        }
      }

      const finalScore = Math.max(0, correctAnswers - negativeMarks)
      const totalTimeTaken = 7200 - timeRemaining

      // Update test session
      await blink.db.test_sessions.update(sessionId, {
        completedAt: new Date().toISOString(),
        isCompleted: 1,
        finalScore: Math.round(finalScore),
        totalAttempted,
        correctAnswers,
        negativeMarks: Math.round(negativeMarks * 100) / 100,
        timeTakenSeconds: totalTimeTaken
      })

      setIsTestCompleted(true)
      setIsTestActive(false)
    } catch (error) {
      console.error('Failed to submit test:', error)
    }
  }, [questions, answers, confidenceLevels, questionTimes, sessionId, timeRemaining])

  useEffect(() => {
    loadQuestions()
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isTestActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitTest()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isTestActive, timeRemaining, handleSubmitTest])

  const startTest = async () => {
    try {
      const user = await blink.auth.me()
      const newSessionId = `session_${Date.now()}_${user.id}`
      
      await blink.db.test_sessions.create({
        id: newSessionId,
        userId: user.id,
        testName: 'Practice Test',
        testType: 'practice',
        totalQuestions: questions.length,
        durationMinutes: 120,
        startedAt: new Date().toISOString(),
        isCompleted: 0,
        finalScore: 0,
        totalAttempted: 0,
        correctAnswers: 0,
        negativeMarks: 0,
        timeTakenSeconds: 0
      })

      setSessionId(newSessionId)
      setIsTestActive(true)
      setQuestionStartTime(Date.now())
    } catch (error) {
      console.error('Failed to start test:', error)
    }
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const triggerVoiceMemoIfNeeded = async (questionId: string, selectedAnswer: string, confidence: number) => {
    const question = questions.find(q => q.id === questionId)
    if (!question) return

    const isCorrect = selectedAnswer === question.correctAnswer
    
    // Create question attempt record first
    const user = await blink.auth.me()
    const attemptId = `attempt_${Date.now()}_${questionId}`
    
    await blink.db.question_attempts.create({
      id: attemptId,
      userId: user.id,
      sessionId: sessionId,
      questionId: questionId,
      selectedAnswer: selectedAnswer,
      isCorrect: isCorrect ? 1 : 0,
      confidenceLevel: confidence,
      timeTakenSeconds: questionTimes[questionId] || 60,
      optionChanges: 0,
      wasSkipped: 0,
      wasReturnedTo: 0,
      attemptOrder: questions.findIndex(q => q.id === questionId) + 1,
      createdAt: new Date().toISOString()
    })

    // Check if voice memo should be triggered
    const shouldTrigger = !isCorrect || (isCorrect && confidence <= 2)
    
    if (shouldTrigger) {
      setVoiceMemoQuestionId(questionId)
      setVoiceMemoAttemptId(attemptId)
      setVoiceMemoIsCorrect(isCorrect)
      setVoiceMemoConfidence(confidence)
      setShowVoiceMemoTrigger(true)
    }
  }

  const handleConfidenceChange = async (questionId: string, confidence: number) => {
    setConfidenceLevels(prev => ({ ...prev, [questionId]: confidence }))
    
    // Trigger voice memo if answer is already selected
    const selectedAnswer = answers[questionId]
    if (selectedAnswer) {
      await triggerVoiceMemoIfNeeded(questionId, selectedAnswer, confidence)
    }
  }

  const handleQuestionNavigation = (direction: 'prev' | 'next') => {
    // Record time spent on current question
    const currentQuestion = questions[currentQuestionIndex]
    if (currentQuestion) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
      setQuestionTimes(prev => ({
        ...prev,
        [currentQuestion.id]: (prev[currentQuestion.id] || 0) + timeSpent
      }))
    }

    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
    
    setQuestionStartTime(Date.now())
  }

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const answeredCount = Object.keys(answers).length
  const flaggedCount = flaggedQuestions.size

  if (isTestCompleted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-600">Test Completed! 🎉</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{answeredCount}</div>
                <div className="text-sm text-blue-800">Questions Attempted</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{formatTime(7200 - timeRemaining)}</div>
                <div className="text-sm text-green-800">Time Taken</div>
              </div>
            </div>
            <p className="text-slate-600">
              Your detailed analytics and performance insights are being generated...
            </p>
            <Button onClick={() => window.location.href = '/analytics'} className="w-full">
              View Detailed Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isTestActive) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">UPSC CSE Prelims Practice Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Test Instructions</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Duration: 2 hours (120 minutes)</li>
                <li>• Total Questions: {questions.length}</li>
                <li>• Marking Scheme: +1 for correct, -1/3 for incorrect</li>
                <li>• Rate your confidence (1-5) after each answer</li>
                <li>• You can flag questions for review</li>
                <li>• Navigate freely between questions</li>
              </ul>
            </div>
            
            <div className="text-center">
              <Button onClick={startTest} size="lg" className="px-8">
                <Play className="w-5 h-5 mr-2" />
                Start Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentQuestion) {
    return <div className="text-center">Loading questions...</div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Test Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className={`font-mono text-lg ${timeRemaining < 900 ? 'text-red-600' : 'text-slate-900'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="text-sm text-slate-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <Progress value={progress} className="w-32" />
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                <CheckCircle className="w-4 h-4 mr-1" />
                {answeredCount} Answered
              </Badge>
              <Badge variant="outline">
                <Flag className="w-4 h-4 mr-1" />
                {flaggedCount} Flagged
              </Badge>
              <Button onClick={handleSubmitTest} variant="destructive" size="sm">
                Submit Test
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Panel */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Question {currentQuestionIndex + 1}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant={currentQuestion.difficultyLevel === 'easy' ? 'secondary' : 
                                currentQuestion.difficultyLevel === 'medium' ? 'default' : 'destructive'}>
                    {currentQuestion.difficultyLevel}
                  </Badge>
                  <Badge variant="outline">{currentQuestion.topic}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={flaggedQuestions.has(currentQuestion.id) ? 'text-amber-600' : ''}
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question Text */}
              <div className="text-lg leading-relaxed">
                {currentQuestion.questionText}
              </div>

              {/* Options */}
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                className="space-y-3"
              >
                {[
                  { key: 'A', text: currentQuestion.optionA },
                  { key: 'B', text: currentQuestion.optionB },
                  { key: 'C', text: currentQuestion.optionC },
                  { key: 'D', text: currentQuestion.optionD },
                ].map((option) => (
                  <div key={option.key} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                    <RadioGroupItem value={option.key} id={option.key} />
                    <Label htmlFor={option.key} className="flex-1 cursor-pointer">
                      <span className="font-medium mr-2">({option.key})</span>
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {/* Confidence Slider */}
              {answers[currentQuestion.id] && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Label className="text-sm font-medium text-blue-900 mb-3 block">
                    How confident are you about this answer? (1 = Not confident, 5 = Very confident)
                  </Label>
                  <div className="space-y-2">
                    <Slider
                      value={[confidenceLevels[currentQuestion.id] || 3]}
                      onValueChange={(value) => handleConfidenceChange(currentQuestion.id, value[0])}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-blue-700">
                      <span>Not Confident</span>
                      <span className="font-medium">
                        Level {confidenceLevels[currentQuestion.id] || 3}
                      </span>
                      <span>Very Confident</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleQuestionNavigation('prev')}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <SkipForward className="w-4 h-4 mr-1" />
                    Skip
                  </Button>
                </div>

                <Button
                  onClick={() => handleQuestionNavigation('next')}
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Navigator */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Question Navigator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const isAnswered = answers[question.id]
                  const isFlagged = flaggedQuestions.has(question.id)
                  const isCurrent = index === currentQuestionIndex
                  
                  return (
                    <button
                      key={question.id}
                      onClick={() => {
                        setCurrentQuestionIndex(index)
                        setQuestionStartTime(Date.now())
                      }}
                      className={`
                        w-8 h-8 text-xs font-medium rounded border-2 transition-colors
                        ${isCurrent 
                          ? 'border-blue-600 bg-blue-600 text-white' 
                          : isAnswered 
                            ? 'border-green-500 bg-green-500 text-white'
                            : isFlagged
                              ? 'border-amber-500 bg-amber-500 text-white'
                              : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                        }
                      `}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
              
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-amber-500 rounded"></div>
                  <span>Flagged</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>Current</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 border-2 border-slate-300 rounded"></div>
                  <span>Not Visited</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Voice Memo Trigger */}
      {showVoiceMemoTrigger && (
        <VoiceMemoTrigger
          questionId={voiceMemoQuestionId}
          questionAttemptId={voiceMemoAttemptId}
          isCorrect={voiceMemoIsCorrect}
          confidenceLevel={voiceMemoConfidence}
          onComplete={() => setShowVoiceMemoTrigger(false)}
        />
      )}
    </div>
  )
}