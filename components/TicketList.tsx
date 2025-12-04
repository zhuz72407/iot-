import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus, Role, Priority } from '../types';
import { PlusCircle, Search, Clock, CheckCircle, AlertCircle, FileCheck, ArrowDownUp, Calendar, Layers } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  currentUserRole: Role;
  onSelectTicket: (ticket: Ticket) => void;
  onCreateTicket: () => void;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, currentUserRole, onSelectTicket, onCreateTicket }) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterText, setFilterText] = useState('');
  // Default active tab
  const [activeTab, setActiveTab] = useState<'PENDING' | 'PROCESSING' | 'RESOLVED'>('PENDING');

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.PENDING: return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case TicketStatus.PROCESSING: return <Clock className="w-5 h-5 text-blue-500" />;
      case TicketStatus.PENDING_CLOSURE: return <FileCheck className="w-5 h-5 text-purple-500" />;
      case TicketStatus.RESOLVED: return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // Define tabs configuration
  const tabs = [
    { 
      id: 'PENDING', 
      label: '待处理', 
      statuses: [TicketStatus.PENDING],
      icon: AlertCircle
    },
    { 
      id: 'PROCESSING', 
      label: '处理中', 
      statuses: [TicketStatus.PROCESSING, TicketStatus.PENDING_CLOSURE],
      icon: Clock
    },
    { 
      id: 'RESOLVED', 
      label: '已处理', 
      statuses: [TicketStatus.RESOLVED],
      icon: CheckCircle
    }
  ] as const;

  // Calculate counts for badges
  const getTabCount = (tabId: string) => {
     const tabObj = tabs.find(t => t.id === tabId);
     if(!tabObj) return 0;
     return tickets.filter(t => (tabObj.statuses as readonly TicketStatus[]).includes(t.status)).length;
  };

  // Filter and Sort Logic
  const displayTickets = useMemo(() => {
    let result = [...tickets];

    // 1. Filter by Tab (Status)
    const currentTabObj = tabs.find(t => t.id === activeTab);
    if (currentTabObj) {
      result = result.filter(t => (currentTabObj.statuses as readonly TicketStatus[]).includes(t.status));
    }

    // 2. Filter by Search Text
    if (filterText.trim()) {
      const lower = filterText.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(lower) || 
        t.id.toLowerCase().includes(lower) ||
        t.content.toLowerCase().includes(lower)
      );
    }

    // 3. Sort
    result.sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.createdAt - a.createdAt; // Newest first
      } else {
        return a.createdAt - b.createdAt; // Oldest first
      }
    });

    return result;
  }, [tickets, sortOrder, filterText, activeTab]);

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
           <Layers size={20} className="text-indigo-600"/> 工单列表
        </h2>
        {currentUserRole === Role.FRONT_SUPPORT && (
          <button 
            onClick={onCreateTicket}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm text-sm"
          >
            <PlusCircle size={16} />
            新建
          </button>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const count = getTabCount(tab.id);
            const Icon = tab.icon;
            return (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all flex items-center justify-center gap-2
                        ${isActive 
                            ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }
                    `}
                >
                    <Icon size={16} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                    {tab.label}
                    {count > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full min-w-[1.25rem] text-center
                            ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}
                        `}>
                            {count}
                        </span>
                    )}
                </button>
            )
        })}
      </div>

      {/* Search/Filter Controls */}
      <div className="p-4 border-b border-gray-200 bg-white flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="搜索工单..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <button 
          onClick={toggleSort}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 transition-colors whitespace-nowrap"
          title={sortOrder === 'desc' ? '当前：最新优先' : '当前：最早优先'}
        >
          <ArrowDownUp size={16} />
          <span className="text-xs font-medium hidden md:inline">
            {sortOrder === 'desc' ? '最新' : '最早'}
          </span>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-gray-100">
          {displayTickets.map(ticket => (
            <li 
              key={ticket.id} 
              onClick={() => onSelectTicket(ticket)}
              className="p-4 hover:bg-indigo-50 cursor-pointer transition-colors duration-150 group"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-gray-800 truncate pr-2 text-sm md:text-base">{ticket.title}</span>
                <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-2">
                   {getStatusIcon(ticket.status)}
                   <span className="text-xs md:text-sm text-gray-600">{ticket.status}</span>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded border 
                  ${ticket.priority === Priority.HIGH ? 'border-red-200 bg-red-50 text-red-700' : 
                    ticket.priority === Priority.MEDIUM ? 'border-orange-200 bg-orange-50 text-orange-700' : 
                    'border-green-200 bg-green-50 text-green-700'}`}>
                  {ticket.priority}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500 truncate">
                {ticket.content}
              </div>
            </li>
          ))}
          {displayTickets.length === 0 && (
             <li className="p-8 text-center text-gray-500 flex flex-col items-center mt-10">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                  <Search size={32} />
               </div>
               <span>{filterText ? '未找到匹配的工单' : '该分类下暂无工单'}</span>
             </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default TicketList;