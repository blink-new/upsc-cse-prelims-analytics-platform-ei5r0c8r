import { Bell, Search, User as UserIcon, LogOut } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu'
import { Badge } from '../ui/badge'
import { blink } from '../../blink/client'
import { User } from '../../types'

interface HeaderProps {
  user: User
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search questions, topics, or analytics..."
              className="pl-10 bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium">{user.displayName || user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => blink.auth.logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="mt-4 flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-slate-600">Tests Completed: <span className="font-medium text-slate-900">24</span></span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-slate-600">Average Score: <span className="font-medium text-slate-900">68%</span></span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          <span className="text-slate-600">Study Streak: <span className="font-medium text-slate-900">12 days</span></span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span className="text-slate-600">Next Target: <span className="font-medium text-slate-900">75%</span></span>
        </div>
      </div>
    </header>
  )
}