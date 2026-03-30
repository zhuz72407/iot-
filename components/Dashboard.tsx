
import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus, Urgency } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  CartesianGrid
} from 'recharts';
import { 
  CheckCircle2, 
  Clock, 
  Activity, 
  Calendar as CalendarIcon, 
  FilterX,
  TrendingUp,
  BarChart3,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DashboardProps {
  tickets: Ticket[];
}

export const Dashboard: React.FC<DashboardProps> = ({ tickets }) => {
  // Default date range: Last 7 days for a better default trend view
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  // Helper to set quick ranges
  const setRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1)); // -1 to include today
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  // Filter tickets based on date range
  const filteredTickets = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    return tickets.filter(t => {
      const tDate = new Date(t.createdAt);
      return tDate >= start && tDate <= end;
    });
  }, [tickets, startDate, endDate]);

  // Calculate Stats based on FILTERED data
  const total = filteredTickets.length;
  const inProgress = filteredTickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length;
  const resolved = filteredTickets.filter(t => t.status === TicketStatus.RESOLVED).length;
  const pending = filteredTickets.filter(t => t.status === TicketStatus.PENDING).length;
  
  // Completion Rate
  const completionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Global "Created Today" stat (Total in Period)
  const totalCreatedInPeriod = total;

  // --- Data Processing for Trend Chart ---
  const trendData = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const data: { date: string; count: number }[] = [];
    
    // Generate all dates in range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      // Count tickets for this day
      const count = filteredTickets.filter(t => t.createdAt.startsWith(dateStr)).length;
      
      // Format date for display (e.g., "10-24")
      const displayDate = d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
      
      data.push({
        date: displayDate,
        count: count
      });
    }
    return data;
  }, [filteredTickets, startDate, endDate]);

  const urgencyData = [
    { name: '高', count: filteredTickets.filter(t => t.urgency === Urgency.HIGH).length },
    { name: '中', count: filteredTickets.filter(t => t.urgency === Urgency.MEDIUM).length },
    { name: '低', count: filteredTickets.filter(t => t.urgency === Urgency.LOW).length },
  ];

  // Gauge Chart Data (Half Donut)
  const gaugeData = [
    { name: 'Completed', value: completionRate, color: '#10b981' }, // Green
    { name: 'Remaining', value: 100 - completionRate, color: '#e2e8f0' }, // Slate-200
  ];

  // Recent tickets for table (using filtered list)
  const recentTickets = [...filteredTickets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const resetFilters = () => {
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
  };

  const handleExport = () => {
    if (filteredTickets.length === 0) {
      alert("当前选定范围内无数据可导出");
      return;
    }

    const exportData = filteredTickets.map(ticket => ({
      '问诊单号': ticket.id,
      '问诊标题': ticket.title,
      '故障描述': ticket.description,
      '紧急程度': ticket.urgency,
      '当前状态': ticket.status,
      '流程阶段': ticket.stage,
      '发起人': ticket.creator,
      '创建时间': new Date(ticket.createdAt).toLocaleString('zh-CN'),
      '完成时间': ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString('zh-CN') : '-',
      '当前处理人': ticket.assignedTo.join(', ') || '无',
      'AI分析结果': ticket.aiAnalysis ? ticket.aiAnalysis.slice(0, 100) + '...' : '暂无',
      '最新诊断': ticket.diagnoses.length > 0 ? ticket.diagnoses[ticket.diagnoses.length - 1].content : '无'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "问诊报表");

    // Generate filename with date range
    const filename = `理想车企IoT问诊报表_${startDate}_${endDate}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
           <h2 className="text-3xl font-bold text-slate-800 tracking-tight">运营仪表盘</h2>
           <p className="text-slate-500 mt-2 flex items-center gap-2">
             <Activity className="w-4 h-4 text-brand-500" />
             实时监控问诊处理效率与业务趋势
           </p>
        </div>
        
        {/* Date Filter Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
             <button 
               onClick={() => setRange(7)}
               className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600"
             >
               近一周
             </button>
             <button 
               onClick={() => setRange(30)}
               className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600"
             >
               近一月
             </button>
          </div>
          
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-2 px-2">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none w-28"
            />
            <span className="text-slate-300">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none w-28"
            />
          </div>

          <button 
            onClick={resetFilters}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-red-500 transition ml-1"
            title="重置日期"
          >
            <FilterX className="w-4 h-4" />
          </button>

          <button
            onClick={handleExport}
            className="ml-2 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-200"
            title="下载Excel报表"
          >
             <Download className="w-4 h-4" />
             导出 Excel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(6,182,212,0.1)] border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">期间新增</p>
            <p className="text-3xl font-bold text-slate-800">{totalCreatedInPeriod}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(245,158,11,0.1)] border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">正在处理</p>
            <p className="text-3xl font-bold text-slate-800">{inProgress}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(16,185,129,0.1)] border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">已完成</p>
            <p className="text-3xl font-bold text-slate-800">{resolved}</p>
          </div>
        </div>

        {/* Completion Rate Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden flex flex-col justify-between">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">完成率</p>
               <div className="flex items-baseline gap-1">
                 <p className="text-3xl font-bold text-slate-800">{completionRate}%</p>
               </div>
             </div>
             {/* Mini Gauge Chart */}
             <div className="h-16 w-24 -mt-2 -mr-2 opacity-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      cx="50%"
                      cy="100%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={25}
                      outerRadius={40}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      {gaugeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Ticket Volume Trend Bar Chart (Takes up 2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-500" />
              问诊单数量趋势
            </h3>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
               按天统计
            </span>
          </div>
          <div className="h-72">
             {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      allowDecimals={false}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }}
                    />
                    <Bar 
                      dataKey="count" 
                      name="问诊数" 
                      fill="#3b82f6" 
                      radius={[6, 6, 0, 0]} 
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl">
                  暂无趋势数据
                </div>
             )}
          </div>
        </div>

        {/* Urgency Chart (Takes up 1 col) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            紧急程度分布
          </h3>
          <div className="h-72">
            {total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={urgencyData} layout="vertical" margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} 
                    width={50}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                    {
                      urgencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry.name === '高' ? '#ef4444' : 
                          entry.name === '中' ? '#f59e0b' : '#22c55e'
                        } />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl">
                 无数据
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">问诊监控列表</h3>
          <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">
             显示最近 8 条 (基于筛选)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 font-semibold">问诊名称</th>
                <th className="px-6 py-3 font-semibold">提交时间</th>
                <th className="px-6 py-3 font-semibold">紧急程度</th>
                <th className="px-6 py-3 font-semibold">状态/阶段</th>
                <th className="px-6 py-3 font-semibold">当前处理人员</th>
                <th className="px-6 py-3 font-semibold">处理完成时间</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                       <FilterX className="w-10 h-10 text-slate-200" />
                       <p>该筛选条件下无记录</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentTickets.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{t.title}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{formatDate(t.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        t.urgency === Urgency.HIGH ? 'bg-red-50 text-red-600 border-red-100' :
                        t.urgency === Urgency.MEDIUM ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {t.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold ${t.status === TicketStatus.RESOLVED ? 'text-emerald-600' : 'text-blue-600'}`}>
                          {t.status}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{t.stage}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {t.assignedTo.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {t.assignedTo.map((role, idx) => (
                             <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200 text-slate-600">
                               {role.split(' ')[0]}
                             </span>
                          ))}
                        </div>
                      ) : (
                        t.status === TicketStatus.RESOLVED ? <span className="text-slate-400 italic text-xs">已归档</span> : <span className="text-slate-300 italic text-xs">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                       {t.status === TicketStatus.RESOLVED ? (
                         <span className="text-emerald-600 font-medium">{formatDate(t.resolvedAt)}</span>
                       ) : (
                         <span className="text-blue-400 italic">--</span>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
