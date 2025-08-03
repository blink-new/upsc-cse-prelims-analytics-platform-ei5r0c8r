import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Clock, 
  Brain, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Progress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { blink } from '../blink/client'

// Mock data for comprehensive analytics
const performanceOverTime = [
  { date: '2024-01-15', score: 45, confidence: 3.2, timePerQ: 72 },
  { date: '2024-01-16', score: 52, confidence: 3.4, timePerQ: 68 },
  { date: '2024-01-17', score: 48, confidence: 3.1, timePerQ: 75 },
  { date: '2024-01-18', score: 61, confidence: 3.8, timePerQ: 65 },
  { date: '2024-01-19', score: 58, confidence: 3.6, timePerQ: 70 },
  { date: '2024-01-20', score: 65, confidence: 4.1, timePerQ: 62 },
  { date: '2024-01-21', score: 68, confidence: 4.2, timePerQ: 58 },
]

const topicAnalytics = [
  { topic: 'Polity', accuracy: 78, attempted: 45, avgTime: 65, confidence: 4.1 },
  { topic: 'Geography', accuracy: 65, attempted: 38, avgTime: 72, confidence: 3.5 },
  { topic: 'History', accuracy: 72, attempted: 42, avgTime: 68, confidence: 3.8 },
  { topic: 'Economy', accuracy: 58, attempted: 35, avgTime: 78, confidence: 3.2 },
  { topic: 'Environment', accuracy: 81, attempted: 28, avgTime: 60, confidence: 4.3 },
  { topic: 'Current Affairs', accuracy: 52, attempted: 40, avgTime: 85, confidence: 2.9 },
]

const difficultyAnalysis = [
  { level: 'Easy', accuracy: 85, attempted: 45, avgTime: 45 },
  { level: 'Medium', accuracy: 62, attempted: 78, avgTime: 72 },
  { level: 'Hard', accuracy: 38, attempted: 32, avgTime: 95 },
]

const confidenceCalibration = [
  { confidence: 1, accuracy: 25, count: 8 },
  { confidence: 2, accuracy: 42, count: 15 },
  { confidence: 3, accuracy: 58, count: 35 },
  { confidence: 4, accuracy: 72, count: 28 },
  { confidence: 5, accuracy: 88, count: 12 },
]

const radarData = [
  { subject: 'Knowledge', A: 72, fullMark: 100 },
  { subject: 'Speed', A: 68, fullMark: 100 },
  { subject: 'Accuracy', A: 75, fullMark: 100 },
  { subject: 'Strategy', A: 65, fullMark: 100 },
  { subject: 'Confidence', A: 70, fullMark: 100 },
  { subject: 'Consistency', A: 63, fullMark: 100 },
]

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316']

export default function AnalyticsHub() {
  const [selectedMetric, setSelectedMetric] = useState('overview')
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadAnalytics = async () => {
    try {
      const user = await blink.auth.me()
      
      // Load test sessions and attempts for analytics
      const sessions = await blink.db.test_sessions.list({
        where: { userId: user.id },
        orderBy: { startedAt: 'desc' },
        limit: 50
      })

      const attempts = await blink.db.question_attempts.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 500
      })

      // Process analytics data
      setAnalyticsData({ sessions, attempts })
      setLoading(false)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading deep analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics Hub</h1>
          <p className="text-slate-600">Deep insights across 120+ performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-100 text-blue-800">
            <Activity className="w-4 h-4 mr-1" />
            Live Tracking
          </Badge>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Readiness Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">72%</div>
            <Progress value={72} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">+5% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">68%</div>
            <p className="text-xs text-muted-foreground">Across all topics</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time per Question</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">1:08</div>
            <p className="text-xs text-muted-foreground">Target: 1:12</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidence Score</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">3.7/5</div>
            <p className="text-xs text-muted-foreground">Well calibrated</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="difficulty">Difficulty</TabsTrigger>
          <TabsTrigger value="time">Time Mgmt</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      name="Score %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Confidence"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Multi-Dimensional Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Performance"
                      dataKey="A"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Topic Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Topic-wise Performance Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topicAnalytics.map((topic) => (
                  <div key={topic.topic} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{topic.topic}</h4>
                        <Badge variant={topic.accuracy >= 70 ? 'default' : topic.accuracy >= 50 ? 'secondary' : 'destructive'}>
                          {topic.accuracy}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
                        <div>Questions: {topic.attempted}</div>
                        <div>Avg Time: {topic.avgTime}s</div>
                        <div>Confidence: {topic.confidence}/5</div>
                      </div>
                      <Progress value={topic.accuracy} className="mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Syllabus Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Overall Coverage</span>
                    <span className="font-bold">78%</span>
                  </div>
                  <Progress value={78} />
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">12</div>
                      <div className="text-sm text-green-800">Strong Topics</div>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">8</div>
                      <div className="text-sm text-amber-800">Need Focus</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Knowledge Depth Index</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topicAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="topic" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="attempted" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="difficulty" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Difficulty Band Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={difficultyAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="level" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Difficulty Transition Success</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span>Easy → Medium</span>
                    <Badge className="bg-green-100 text-green-800">78%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                    <span>Medium → Hard</span>
                    <Badge className="bg-amber-100 text-amber-800">52%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span>Hard → Easy</span>
                    <Badge className="bg-red-100 text-red-800">35%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Avg per Question</span>
                    <span className="font-bold">1:08</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Variance (σ)</span>
                    <span className="font-bold">±18s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions &gt; Target</span>
                    <span className="font-bold text-amber-600">23%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pacing Accuracy</span>
                    <span className="font-bold text-green-600">77%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Pressure Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">65%</div>
                    <div className="text-sm text-blue-800">Last 15min Accuracy</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">12%</div>
                    <div className="text-sm text-green-800">Early Finish Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recovery Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Catch-up Success</span>
                    <Badge className="bg-green-100 text-green-800">Good</Badge>
                  </div>
                  <Progress value={72} />
                  <p className="text-xs text-slate-600">
                    You recover well from time delays, maintaining 72% accuracy when catching up.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Answer Strategy Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>First Attempt Accuracy</span>
                    <Badge className="bg-blue-100 text-blue-800">74%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>Elimination Success</span>
                    <Badge className="bg-green-100 text-green-800">68%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>Guess Accuracy</span>
                    <Badge className="bg-amber-100 text-amber-800">42%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>Change Answer Success</span>
                    <Badge className="bg-purple-100 text-purple-800">56%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Confidence Calibration</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={confidenceCalibration}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="confidence" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavioral" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stress Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Stress Points Detected</span>
                    <Badge variant="destructive">8</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fatigue Drop (Q80+)</span>
                    <Badge className="bg-amber-100 text-amber-800">-12%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Focus Drift Score</span>
                    <Badge className="bg-blue-100 text-blue-800">Low</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Pattern</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">85%</div>
                    <div className="text-sm text-green-800">Peak Performance</div>
                  </div>
                  <div className="text-sm text-slate-600">
                    Best performance in first 60 minutes
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Persistence Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">78%</div>
                    <div className="text-sm text-purple-800">Re-attempt Rate</div>
                  </div>
                  <div className="text-sm text-slate-600">
                    Good recovery after difficult streaks
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 text-amber-500 mr-2" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">🎯 Performance Pattern</h4>
              <p className="text-sm text-blue-800">
                Your accuracy peaks in the first 45 minutes, then gradually declines. Consider 
                tackling harder questions early when your focus is sharpest.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">📈 Improvement Opportunity</h4>
              <p className="text-sm text-green-800">
                Focus on Current Affairs and Economy topics. Spending 2 extra hours weekly 
                on these could boost your overall score by 8-12 points.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-900 mb-2">⚡ Speed Strategy</h4>
              <p className="text-sm text-amber-800">
                You're spending too much time on medium difficulty questions. Set a 90-second 
                limit and move on to maintain better pacing.
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">🧠 Confidence Calibration</h4>
              <p className="text-sm text-purple-800">
                Your confidence levels are well-calibrated! When you rate confidence as 4+, 
                you're correct 82% of the time. Trust your instincts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}