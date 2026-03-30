
import React from 'react';
import { User, Role } from '../types';
import { 
  LayoutDashboard, 
  Ticket as TicketIcon, 
  BookOpen, 
  LogOut, 
  User as UserIcon,
  Zap,
  Monitor,
  Users
} from 'lucide-react';

interface LayoutProps {
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, activeTab, onTabChange, onLogout, children }) => {
  const navItems = [
    { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
    { id: 'monitor', label: '监控大屏', icon: Monitor },
    { id: 'profile', label: '用户画像', icon: Users },
    { id: 'tickets', label: '问诊中心', icon: TicketIcon },
    { id: 'scc', label: 'SCC 诊断助手', icon: Zap },
    { id: 'knowledge', label: '案例知识库', icon: BookOpen },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-50">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <TicketIcon className="w-5 h-5 text-white" />
            </div>
            理想车企 IoT
          </h1>
          <p className="text-xs text-slate-400 mt-2 ml-10">智能问诊平台</p>
        </div>

        <div className="p-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <div className="font-medium text-sm">{user.name}</div>
              <div className="text-xs text-brand-400 truncate max-w-[150px]">{user.role}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">退出登录</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-slate-100">
        {children}
      </div>
    </div>
  );
};
