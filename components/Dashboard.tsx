import React, { useMemo, useState } from 'react';
import { Ticket, TicketStatus, Priority, Role } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Calendar, Filter, Activity } from 'lucide-react';

interface DashboardProps {
  tickets: Ticket[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard: React.FC<DashboardProps> = ({ tickets }) => {
  // Date Range State (Default to last 30 days)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Filter tickets based on date range
  const filteredTickets = useMemo(() => {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);
    
    return tickets.filter(t => t.createdAt >= start && t.createdAt <= end);
  }, [tickets, startDate, endDate]);

  const stats = useMemo(() => {
    // Today's count (Global metric, not affected by filter generally, or can be)
    // Let's keep "Today's count" as a real-time indicator regardless of filter
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayNew = tickets.filter(t => t.createdAt >= todayStart).length;

    // Stats based on filtered period
    const totalInPeriod = filteredTickets.length;
    const processing = filteredTickets.filter(t => t.status === TicketStatus.PROCESSING || t.status === TicketStatus.PENDING_CLOSURE);
    const resolved = filteredTickets.filter(t => t.status === TicketStatus.RESOLVED);
    const rate = totalInPeriod > 0 ? Math.round((resolved.length / totalInPeriod) * 100) : 0;

    return {
      todayNew,
      totalInPeriod,
      processingCount: processing.length,
      resolvedCount: resolved.length,
      resolutionRate: rate
    };
  }, [tickets, filteredTickets]);

  // Sort filtered tickets for the list
  const recentTickets = [...filteredTickets].sort((a, b) => b.createdAt - a.createdAt);

  const statusData = [
    { name: '待处理', value: filteredTickets.filter(t => t.status === TicketStatus.PENDING).length },
    { name: '处理中', value: filteredTickets.filter(t => t.status === TicketStatus.PROCESSING).length },
    { name: '待归档', value: filteredTickets.filter(t => t.status === TicketStatus.PENDING_CLOSURE).length },
    { name: '已处理', value: filteredTickets.filter(t => t.status === TicketStatus.RESOLVED).length },
  ];

  const priorityData = [
    { name: '高', count: filteredTickets.filter(t => t.priority === Priority.HIGH).length },
    { name: '中', count: filteredTickets.filter(t => t.priority === Priority.MEDIUM).length },
    { name: '低', count: filteredTickets.filter(t => t.priority === Priority.LOW).length },
  ];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Circular Progress Component
  const CircularProgress = ({ value }: { value: number }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg className="transform -rotate-90 w-24 h-24">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="#e2e8f0"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="#6366f1"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute text-lg font-bold text-slate-700">{value}%</span>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Activity className="text-indigo-600" /> 工单监控大屏
           </h2>
           <p className="text-sm text-gray-500 mt-1">实时数据统计与趋势分析</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">筛选时间:</span>
          </div>
          <div className="flex items-center gap-2">
             <input 
               type="date" 
               value={startDate}
               onChange={(e) => setStartDate(e.target.value)}
               className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
             />
             <span className="text-gray-400">-</span>
             <input 
               type="date" 
               value={endDate}
               onChange={(e) => setEndDate(e.target.value)}
               className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
             />
          </div>
        </div>
      </div>
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Today's New (Fixed) */}
        <div className="bg-white p-5 rounded-lg shadow border-l-4 border-blue-500 flex flex-col justify-between">
          <div>
            <div className="text-gray-500 text-sm font-medium mb-1">今日新增工单</div>
            <div className="text-3xl font-bold text-slate-800">{stats.todayNew}</div>
          </div>
          <div className="text-xs text-blue-500 mt-2 bg-blue-50 inline-block px-2 py-1 rounded w-max">
             实时数据
          </div>
        </div>

        {/* Period Total */}
        <div className="bg-white p-5 rounded-lg shadow border-l-4 border-indigo-500 flex flex-col justify-between">
          <div>
            <div className="text-gray-500 text-sm font-medium mb-1">本期工单总数</div>
            <div className="text-3xl font-bold text-slate-800">{stats.totalInPeriod}</div>
          </div>
          <div className="text-xs text-gray-400 mt-2">
             {startDate} 至 {endDate}
          </div>
        </div>

        {/* Processing Count */}
        <div className="bg-white p-5 rounded-lg shadow border-l-4 border-yellow-500 flex flex-col justify-between">
          <div>
             <div className="text-gray-500 text-sm font-medium mb-1">期间处理中</div>
             <div className="text-3xl font-bold text-slate-800">{stats.processingCount}</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${stats.totalInPeriod ? (stats.processingCount/stats.totalInPeriod)*100 : 0}%` }}></div>
          </div>
        </div>

        {/* Resolution Rate with Circular Progress */}
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500 flex items-center justify-between">
          <div>
            <div className="text-gray-500 text-sm font-medium mb-1">本期综合处理率</div>
            <div className="text-sm text-green-600 font-semibold mb-1">
               {stats.resolvedCount} / {stats.totalInPeriod} 单
            </div>
            <div className="text-xs text-gray-400">已归档工单占比</div>
          </div>
          <div className="flex-shrink-0">
             <CircularProgress value={stats.resolutionRate} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow h-80">
          <h3 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2">
            <PieChart className="w-4 h-4" /> 状态分布概览
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 rounded-lg shadow h-80">
          <h3 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2">
             <BarChart className="w-4 h-4" /> 紧急程度分布
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="工单数" fill="#82ca9d" barSize={50} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Ticket List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">工单明细数据 ({stats.totalInPeriod}条)</h3>
          <span className="text-xs text-gray-400">显示选定时间段内的数据</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工单号/名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提交时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">紧急程度</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前处理/待办</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">处理完成时间</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                    <div className="text-xs text-gray-500">{ticket.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(ticket.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${ticket.priority === Priority.HIGH ? 'bg-red-100 text-red-800' : 
                        ticket.priority === Priority.MEDIUM ? 'bg-orange-100 text-orange-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${ticket.status === TicketStatus.PROCESSING ? 'bg-blue-100 text-blue-800' : 
                        ticket.status === TicketStatus.RESOLVED ? 'bg-green-100 text-green-800' : 
                        ticket.status === TicketStatus.PENDING_CLOSURE ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.status === TicketStatus.PENDING && Role.CRT}
                    {ticket.status === TicketStatus.PROCESSING && ticket.assignedTeams.length > 0 ? ticket.assignedTeams.join(', ') : ''}
                    {ticket.status === TicketStatus.PROCESSING && ticket.assignedTeams.length === 0 ? Role.CRT : ''}
                    {ticket.status === TicketStatus.PENDING_CLOSURE && Role.FRONT_SUPPORT}
                    {ticket.status === TicketStatus.RESOLVED && '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.resolvedAt ? formatDate(ticket.resolvedAt) : '-'}
                  </td>
                </tr>
              ))}
              {recentTickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 flex flex-col items-center justify-center">
                    <Calendar className="w-12 h-12 text-gray-300 mb-2" />
                    <span className="text-sm">该时间段内暂无工单数据</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;