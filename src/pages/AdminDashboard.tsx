import React, { useState, useEffect } from 'react'
import { Users, FileText, BarChart3, Settings, Search, Filter, Download, Eye, Trash2, UserCheck, AlertTriangle } from 'lucide-react'
import { blink } from '../blink/client'

interface UserData {
  id: string
  email: string
  displayName: string
  createdAt: string
  lastLoginAt: string
  testsCompleted: number
  totalQuestions: number
  averageScore: number
  status: 'active' | 'inactive' | 'suspended'
}

interface TestData {
  id: string
  title: string
  createdBy: string
  createdAt: string
  totalQuestions: number
  totalAttempts: number
  averageScore: number
  status: 'active' | 'draft' | 'archived'
}

interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalTests: number
  totalQuestions: number
  totalAttempts: number
  averageSystemScore: number
  dailyActiveUsers: number
  weeklyActiveUsers: number
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tests' | 'analytics' | 'settings'>('overview')
  const [users, setUsers] = useState<UserData[]>([])
  const [tests, setTests] = useState<TestData[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const calculateSystemStats = async (): Promise<SystemStats> => {
    // In a real implementation, this would query the database
    // For demo purposes, returning mock data
    return {
      totalUsers: 1247,
      activeUsers: 892,
      totalTests: 156,
      totalQuestions: 15600,
      totalAttempts: 8934,
      averageSystemScore: 72.8,
      dailyActiveUsers: 234,
      weeklyActiveUsers: 678
    }
  }

  const loadUsersData = async (): Promise<UserData[]> => {
    // Mock user data - in real implementation, this would query the database
    return [
      {
        id: 'user_1',
        email: 'john.doe@example.com',
        displayName: 'John Doe',
        createdAt: '2024-01-15T10:30:00Z',
        lastLoginAt: '2024-01-20T14:22:00Z',
        testsCompleted: 12,
        totalQuestions: 1200,
        averageScore: 78.5,
        status: 'active'
      },
      {
        id: 'user_2',
        email: 'jane.smith@example.com',
        displayName: 'Jane Smith',
        createdAt: '2024-01-10T09:15:00Z',
        lastLoginAt: '2024-01-19T16:45:00Z',
        testsCompleted: 8,
        totalQuestions: 800,
        averageScore: 82.3,
        status: 'active'
      },
      {
        id: 'user_3',
        email: 'mike.wilson@example.com',
        displayName: 'Mike Wilson',
        createdAt: '2024-01-05T11:20:00Z',
        lastLoginAt: '2024-01-18T13:10:00Z',
        testsCompleted: 15,
        totalQuestions: 1500,
        averageScore: 69.7,
        status: 'active'
      },
      {
        id: 'user_4',
        email: 'sarah.johnson@example.com',
        displayName: 'Sarah Johnson',
        createdAt: '2023-12-20T08:45:00Z',
        lastLoginAt: '2024-01-15T12:30:00Z',
        testsCompleted: 25,
        totalQuestions: 2500,
        averageScore: 85.2,
        status: 'active'
      },
      {
        id: 'user_5',
        email: 'inactive.user@example.com',
        displayName: 'Inactive User',
        createdAt: '2023-11-15T14:20:00Z',
        lastLoginAt: '2023-12-01T10:15:00Z',
        testsCompleted: 3,
        totalQuestions: 300,
        averageScore: 45.8,
        status: 'inactive'
      }
    ]
  }

  const loadTestsData = async (): Promise<TestData[]> => {
    // Mock test data
    return [
      {
        id: 'test_1',
        title: 'UPSC Prelims Mock Test 2024 - Set 1',
        createdBy: 'admin@upsc.com',
        createdAt: '2024-01-10T10:00:00Z',
        totalQuestions: 100,
        totalAttempts: 234,
        averageScore: 72.5,
        status: 'active'
      },
      {
        id: 'test_2',
        title: 'History & Culture Practice Test',
        createdBy: 'admin@upsc.com',
        createdAt: '2024-01-08T14:30:00Z',
        totalQuestions: 50,
        totalAttempts: 156,
        averageScore: 68.9,
        status: 'active'
      },
      {
        id: 'test_3',
        title: 'Geography & Environment Quiz',
        createdBy: 'admin@upsc.com',
        createdAt: '2024-01-05T09:15:00Z',
        totalQuestions: 75,
        totalAttempts: 189,
        averageScore: 75.3,
        status: 'active'
      },
      {
        id: 'test_4',
        title: 'Draft: Economy & Current Affairs',
        createdBy: 'admin@upsc.com',
        createdAt: '2024-01-15T16:45:00Z',
        totalQuestions: 60,
        totalAttempts: 0,
        averageScore: 0,
        status: 'draft'
      }
    ]
  }

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'delete') => {
    try {
      // In real implementation, this would update the database
      console.log(`${action} user ${userId}`)
      
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: action === 'suspend' ? 'suspended' : action === 'activate' ? 'active' : user.status }
          : user
      ).filter(user => action !== 'delete' || user.id !== userId))
      
    } catch (error) {
      console.error(`Error ${action} user:`, error)
    }
  }

  const handleTestAction = async (testId: string, action: 'archive' | 'activate' | 'delete') => {
    try {
      console.log(`${action} test ${testId}`)
      
      setTests(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: action === 'archive' ? 'archived' : action === 'activate' ? 'active' : test.status }
          : test
      ).filter(test => action !== 'delete' || test.id !== testId))
      
    } catch (error) {
      console.error(`Error ${action} test:`, error)
    }
  }

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n')
    
    return csvContent
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportData = async (type: 'users' | 'tests' | 'analytics') => {
    try {
      let data: any[] = []
      let filename = ''
      
      switch (type) {
        case 'users':
          data = users
          filename = 'users_export.csv'
          break
        case 'tests':
          data = tests
          filename = 'tests_export.csv'
          break
        case 'analytics':
          data = [systemStats]
          filename = 'analytics_export.csv'
          break
      }
      
      const csv = convertToCSV(data)
      downloadCSV(csv, filename)
      
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        // Load system statistics
        const stats = await calculateSystemStats()
        setSystemStats(stats)

        // Load users data
        const usersData = await loadUsersData()
        setUsers(usersData)

        // Load tests data
        const testsData = await loadTestsData()
        setTests(testsData)

      } catch (error) {
        console.error('Error loading admin data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadAdminData()
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || test.status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Complete control and analytics for all users and tests</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'users', label: 'Users', icon: Users },
            { key: 'tests', label: 'Tests', icon: FileText },
            { key: 'analytics', label: 'Analytics', icon: BarChart3 },
            { key: 'settings', label: 'Settings', icon: Settings }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-5 h-5 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && systemStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-900">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">{systemStats.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex items-center">
                <UserCheck className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-900">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">{systemStats.activeUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-900">Total Tests</p>
                  <p className="text-2xl font-bold text-purple-600">{systemStats.totalTests.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-amber-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-amber-900">Avg Score</p>
                  <p className="text-2xl font-bold text-amber-600">{systemStats.averageSystemScore.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">System Activity</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Active Users</span>
                  <span className="font-semibold">{systemStats.dailyActiveUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weekly Active Users</span>
                  <span className="font-semibold">{systemStats.weeklyActiveUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Questions</span>
                  <span className="font-semibold">{systemStats.totalQuestions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Attempts</span>
                  <span className="font-semibold">{systemStats.totalAttempts.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">New user registered: john.doe@example.com</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Test completed: UPSC Mock Test 2024</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">New test created: Economy Practice</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">System backup completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <button
              onClick={() => exportData('users')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Users
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.testsCompleted}</div>
                        <div className="text-sm text-gray-500">{user.totalQuestions} questions</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.averageScore.toFixed(1)}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.lastLoginAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          {user.status === 'active' ? (
                            <button 
                              onClick={() => handleUserAction(user.id, 'suspend')}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleUserAction(user.id, 'activate')}
                              className="text-green-600 hover:text-green-900"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleUserAction(user.id, 'delete')}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tests Tab */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <button
              onClick={() => exportData('tests')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Tests
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{test.title}</div>
                          <div className="text-sm text-gray-500">by {test.createdBy}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.totalQuestions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.totalAttempts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.averageScore > 0 ? `${test.averageScore.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          test.status === 'active' ? 'bg-green-100 text-green-800' :
                          test.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {test.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(test.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          {test.status === 'active' ? (
                            <button 
                              onClick={() => handleTestAction(test.id, 'archive')}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleTestAction(test.id, 'activate')}
                              className="text-green-600 hover:text-green-900"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleTestAction(test.id, 'delete')}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">System Analytics</h2>
            <button
              onClick={() => exportData('analytics')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Analytics
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Comprehensive System Metrics</h3>
            <p className="text-gray-600 mb-4">
              Detailed analytics dashboard showing all user performance metrics, test statistics, 
              and system health indicators would be displayed here.
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                This section would include:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                <li>User engagement and retention metrics</li>
                <li>Test performance analytics across all users</li>
                <li>Topic-wise difficulty and success rates</li>
                <li>System usage patterns and peak times</li>
                <li>Performance benchmarking and trends</li>
                <li>Error rates and system health monitoring</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">System Settings</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">General Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Maintenance Mode
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Disabled</option>
                    <option>Enabled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Test Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    defaultValue={120}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Questions Per Test
                  </label>
                  <input
                    type="number"
                    defaultValue={100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    defaultValue={60}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Failed Login Attempts Limit
                  </label>
                  <input
                    type="number"
                    defaultValue={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Minimum Length
                  </label>
                  <input
                    type="number"
                    defaultValue={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  )
}