import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Upload, 
  BookOpen, 
  MessageSquare, 
  Mic, 
  Users, 
  Settings,
  Target,
  Brain,
  TrendingUp,
  PlusCircle,
  Database,
  Shield,
  Activity
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Take Test', href: '/test', icon: FileText },
  { name: 'Create Test', href: '/create-test', icon: PlusCircle },
  { name: 'Analytics Hub', href: '/analytics', icon: BarChart3 },
  { name: 'Complete Analytics', href: '/complete-analytics', icon: Activity },
  { name: 'Upload PDFs', href: '/upload', icon: Upload },
  { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
  { name: 'KB Upload', href: '/knowledge-upload', icon: Database },
  { name: 'AI Debates', href: '/debates', icon: MessageSquare },
  { name: 'Voice Memos', href: '/voice-memos', icon: Mic },
  { name: 'Study Groups', href: '/study-groups', icon: Users },
  { name: 'Admin Panel', href: '/admin', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">UPSC CSE</h1>
              <p className="text-xs text-slate-500">Analytics Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Quick Stats */}
        <div className="px-4 py-4 border-t border-slate-200">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Readiness Score</span>
              <Brain className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '72%' }}></div>
              </div>
              <span className="text-sm font-bold text-blue-600">72%</span>
            </div>
            <div className="flex items-center mt-2 text-xs text-slate-500">
              <TrendingUp className="w-3 h-3 mr-1" />
              +5% from last week
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}