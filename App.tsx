import React, { useState, useEffect } from 'react';
import { Role, Ticket, Notification } from './types';
import { getTickets, addTicket, updateTicket, getCaseLibrary, getNotifications, getUnreadCount } from './services/mockData';
import Dashboard from './components/Dashboard';
import TicketList from './components/TicketList';
import TicketDetail from './components/TicketDetail';
import CreateTicketModal from './components/CreateTicketModal';
import CaseLibrary from './components/CaseLibrary';
import NotificationPanel from './components/NotificationPanel';
import { LayoutDashboard, List, BookOpen, LogOut, User, Menu, Bell, ArrowRight, ChevronDown } from 'lucide-react';

enum View {
  DASHBOARD = 'dashboard',
  TICKETS = 'tickets',
  CASE_LIBRARY = 'case_library'
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Role | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Login State
  const [selectedRole, setSelectedRole] = useState<Role>(Object.values(Role)[0]);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  // Initialize Data
  useEffect(() => {
    setTickets(getTickets());
    if (currentUser) {
        refreshNotifications();
    }
  }, [currentUser]);

  const refreshNotifications = () => {
      if (currentUser) {
        setNotifications(getNotifications(currentUser));
        setUnreadCount(getUnreadCount(currentUser));
      }
  };

  const handleLogin = () => {
    setCurrentUser(selectedRole);
    setCurrentView(View.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedTicket(null);
    setIsNotificationPanelOpen(false);
  };

  const refreshTickets = () => {
    setTickets(getTickets());
    refreshNotifications(); // Also refresh notifications when tickets update
  };

  const handleCreateTicket = (ticket: Ticket) => {
    addTicket(ticket);
    refreshTickets();
    setIsCreateModalOpen(false);
    setCurrentView(View.TICKETS); // Go to list to see it
  };

  const handleUpdateTicket = (updatedTicket: Ticket) => {
    updateTicket(updatedTicket);
    refreshTickets();
    setSelectedTicket(updatedTicket); // Update detailed view with new data
  };
  
  const handleNotificationSelect = (ticketId: string) => {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
          setSelectedTicket(ticket);
          setCurrentView(View.TICKETS);
          // Optional: close panel or mark as read logic here
      }
  };

  // --- Login Screen ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl flex flex-col md:flex-row overflow-hidden min-h-[500px]">
          <div className="md:w-1/2 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100">
            <h1 className="text-3xl font-extrabold text-indigo-700 mb-2">IoT 智慧工单</h1>
            <p className="text-gray-500 mb-10">物联网故障投诉处理系统</p>
            
            <div className="space-y-6 max-w-sm mx-auto w-full">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">请选择登录角色</label>
                  <div className="relative">
                      <select 
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as Role)}
                          className="w-full p-4 pl-12 pr-10 border border-gray-300 rounded-xl appearance-none focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 bg-white shadow-sm transition-shadow text-base cursor-pointer hover:border-indigo-300"
                      >
                          {Object.values(Role).map((role) => (
                              <option key={role} value={role}>{role}</option>
                          ))}
                      </select>
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                  </div>
               </div>

               <button
                   onClick={handleLogin}
                   className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex justify-center items-center gap-2 text-lg"
               >
                   进入系统
                   <ArrowRight size={20} />
               </button>

               <div className="text-center">
                 <p className="text-xs text-gray-400">
                   系统演示环境 · 无需密码
                 </p>
               </div>
            </div>
          </div>
          
          <div className="md:w-1/2 bg-indigo-600 p-8 text-white flex flex-col justify-center items-center text-center relative overflow-hidden">
             {/* Decorative Background Circles */}
             <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-indigo-500 opacity-30"></div>
             <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-indigo-500 opacity-30"></div>

             <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 shadow-inner border border-white/20">
                <LayoutDashboard size={48} className="text-white" />
             </div>
             <h2 className="text-2xl font-bold mb-4">全流程可视化协同</h2>
             <p className="text-indigo-100 text-sm leading-relaxed max-w-xs mx-auto opacity-90">
               集成 Gemini AI 辅助分析，打破部门壁垒。<br/>
               实时监控、专业诊断、知识沉淀。<br/>
               提升物联网故障响应效率。
             </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Main App ---
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl z-20 relative`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-800 h-16">
          {isSidebarOpen && <span className="font-bold text-lg tracking-wide text-indigo-400">IoT 工单系统</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-2">
          <button
            onClick={() => { setCurrentView(View.DASHBOARD); setSelectedTicket(null); }}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${currentView === View.DASHBOARD ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            {isSidebarOpen && <span>数据大屏</span>}
          </button>
          <button
            onClick={() => { setCurrentView(View.TICKETS); setSelectedTicket(null); }}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${currentView === View.TICKETS ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <List size={20} />
            {isSidebarOpen && <span>工单处理</span>}
          </button>
          <button
            onClick={() => { setCurrentView(View.CASE_LIBRARY); setSelectedTicket(null); }}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${currentView === View.CASE_LIBRARY ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <BookOpen size={20} />
            {isSidebarOpen && <span>案例知识库</span>}
          </button>
        </nav>

        {/* Notification Bell in Sidebar (Bottom) */}
        <div className="px-4 py-2">
            <button 
                onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors relative
                    ${isNotificationPanelOpen ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
            >
                <div className="relative">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </div>
                {isSidebarOpen && <span>消息通知</span>}
                {isSidebarOpen && unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>
        </div>

        <div className="p-4 border-t border-slate-800">
           <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
             <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
               {currentUser.charAt(0)}
             </div>
             {isSidebarOpen && (
               <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-medium truncate">{currentUser}</p>
                 <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mt-1">
                   <LogOut size={12} /> 退出登录
                 </button>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center px-6 justify-between z-10 relative">
          <h2 className="text-xl font-semibold text-gray-800">
            {currentView === View.DASHBOARD && '运营监控'}
            {currentView === View.TICKETS && '工单管理'}
            {currentView === View.CASE_LIBRARY && '知识库'}
          </h2>
          <div className="text-sm text-gray-500 flex items-center gap-4">
             {/* Mobile Notification Trigger could go here too */}
             <span>{new Date().toLocaleDateString()}</span>
          </div>
          
          {/* Notification Panel (Overlay) */}
          <NotificationPanel 
            isOpen={isNotificationPanelOpen}
            onClose={() => setIsNotificationPanelOpen(false)}
            notifications={notifications}
            currentUser={currentUser}
            onRefresh={refreshNotifications}
            onSelectNotification={handleNotificationSelect}
          />
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-hidden p-4 relative" onClick={() => { if(isNotificationPanelOpen) setIsNotificationPanelOpen(false) }}>
          
          {/* Dashboard View */}
          {currentView === View.DASHBOARD && (
            <div className="h-full overflow-y-auto">
              <Dashboard tickets={tickets} />
            </div>
          )}

          {/* Ticket System View (List + Detail) */}
          {currentView === View.TICKETS && (
            <div className="h-full flex gap-4">
              <div className={`${selectedTicket ? 'hidden md:block md:w-1/3' : 'w-full'} h-full transition-all`}>
                <TicketList 
                  tickets={tickets} 
                  currentUserRole={currentUser}
                  onSelectTicket={setSelectedTicket}
                  onCreateTicket={() => setIsCreateModalOpen(true)}
                />
              </div>
              {selectedTicket && (
                <div className="w-full md:w-2/3 h-full animate-slide-in">
                  <TicketDetail 
                    ticket={selectedTicket}
                    currentUserRole={currentUser}
                    onUpdateTicket={handleUpdateTicket}
                    onClose={() => setSelectedTicket(null)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Case Library View */}
          {currentView === View.CASE_LIBRARY && (
            <div className="h-full overflow-y-auto">
              <CaseLibrary cases={getCaseLibrary()} />
            </div>
          )}
        </main>
        
        {/* Create Ticket Modal */}
        {isCreateModalOpen && (
          <CreateTicketModal 
            currentUser={currentUser}
            onSave={handleCreateTicket}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default App;