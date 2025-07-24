import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { supabase, TestSession, AnalyticsMetric } from '@/lib/supabase'
import { aiService } from '@/lib/ai'

interface DashboardStats {
  testsCompleted: number
  averageScore: number
  studyHours: number
  readinessScore: number
  recentSessions: TestSession[]
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
  const [user, setUser] = useState<any>(null)

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      setUser(userData.user)

      // Load test sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })
        .limit(10)

      if (sessionsError) throw sessionsError

      // Load analytics metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('analytics_metrics')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('is_current', true)

      if (metricsError) throw metricsError

      // Calculate dashboard statistics
      const testsCompleted = sessions?.length || 0
      const averageScore = sessions?.length 
        ? sessions.reduce((sum, session) => sum + (session.score || 0), 0) / sessions.length
        : 0

      // Calculate study hours (mock data for now)
      const studyHours = testsCompleted * 2.5 // Approximate 2.5 hours per test

      // Calculate readiness score based on recent performance
      const readinessScore = Math.min(95, Math.max(30, averageScore + (testsCompleted * 2)))

      // Prepare performance trend data
      const performanceTrend = sessions?.slice(0, 7).reverse().map((session, index) => ({
        test: `Test ${index + 1}`,
        score: session.score || 0,
        date: new Date(session.completed_at || '').toLocaleDateString()
      })) || []

      // Prepare topic performance data (mock data based on metrics)
      const topicPerformance = [
        { topic: 'History', score: 75, attempted: 25 },
        { topic: 'Geography', score: 68, attempted: 22 },
        { topic: 'Polity', score: 82, attempted: 28 },
        { topic: 'Economics', score: 71, attempted: 20 },
        { topic: 'Environment', score: 79, attempted: 24 },
        { topic: 'Current Affairs', score: 65, attempted: 18 }
      ]

      // Generate AI insights
      const performanceData = {
        testsCompleted,
        averageScore,
        recentScores: sessions?.slice(0, 5).map(s => s.score) || [],
        topicPerformance,
        studyHours
      }

      const aiInsights = await aiService.generateMentorInsights(performanceData)

      setStats({
        testsCompleted,
        averageScore,
        studyHours,
        readinessScore,
        recentSessions: sessions || [],
        performanceTrend,
        topicPerformance,
        aiInsights
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
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
            <span>AI-Enhanced</span>
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
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Test Session</p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.completed_at || '').toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={session.score && session.score >= 70 ? 'default' : 'secondary'}>
                      {session.score?.toFixed(1)}%
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