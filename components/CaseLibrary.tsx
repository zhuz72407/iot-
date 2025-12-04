import React, { useState, useMemo } from 'react';
import { Priority, Role, Ticket, TicketStatus } from '../types';
import { addTicket } from '../services/mockData';
import { Search, FileText, Bookmark, Plus, X, Save } from 'lucide-react';

interface CaseLibraryProps {
  cases: Ticket[];
}

const CaseLibrary: React.FC<CaseLibraryProps> = ({ cases: initialCases }) => {
  const [cases, setCases] = useState<Ticket[]>(initialCases);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Sync internal state if props change (though we update locally too)
  React.useEffect(() => {
    setCases(initialCases);
  }, [initialCases]);

  const filteredCases = useMemo(() => {
    if (!searchTerm) return cases;
    const lower = searchTerm.toLowerCase();
    return cases.filter(c => 
      c.title.toLowerCase().includes(lower) || 
      c.content.toLowerCase().includes(lower) ||
      (c.resolution && c.resolution.toLowerCase().includes(lower))
    );
  }, [cases, searchTerm]);

  // --- Upload Modal Component ---
  const UploadModal = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [resolution, setResolution] = useState('');
    const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);

    const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (!title || !content || !resolution) return;

      const newCase: Ticket = {
        id: `CASE-${Date.now()}`, // Distinct ID for manual cases
        title,
        content,
        priority,
        status: TicketStatus.RESOLVED, // Cases are always resolved
        creator: Role.CRT, // Default to CRT or System
        createdAt: Date.now(),
        assignedTeams: [],
        diagnoses: [],
        resolution: resolution, // Critical for knowledge base
        resolvedAt: Date.now()
      };

      addTicket(newCase);
      
      // Update local view immediately
      setCases(prev => [newCase, ...prev]);
      setIsUploadModalOpen(false);
      alert("案例已成功录入知识库！AI分析现可参考此案例。");
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in-up">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
          <button 
            onClick={() => setIsUploadModalOpen(false)} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
          
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Bookmark className="text-indigo-600" /> 录入新故障案例
          </h3>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">案例标题</label>
              <input 
                type="text" 
                required
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="例如：5G切片专网延迟高排查"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">紧急/重要程度</label>
                  <select 
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={priority}
                    onChange={e => setPriority(e.target.value as Priority)}
                  >
                    <option value={Priority.HIGH}>高</option>
                    <option value={Priority.MEDIUM}>中</option>
                    <option value={Priority.LOW}>低</option>
                  </select>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">故障现象描述</label>
              <textarea 
                required
                className="w-full border border-gray-300 rounded-md p-2 h-24 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="描述故障发生的环境、现象、报错信息等..."
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">解决方案 / 经验总结 (核心知识)</label>
              <textarea 
                required
                className="w-full border border-green-300 bg-green-50 rounded-md p-2 h-32 focus:ring-2 focus:ring-green-500 outline-none resize-none"
                placeholder="详细描述问题是如何解决的，包含参数修改、硬件更换或操作步骤..."
                value={resolution}
                onChange={e => setResolution(e.target.value)}
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
              >
                <Save size={18} /> 保存至知识库
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-slate-50 h-full relative">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-8">
            <div className="text-center md:text-left flex-1">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">案例知识库</h2>
                <p className="text-slate-500">搜索历史故障案例，辅助快速定位问题</p>
            </div>
            <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm font-medium"
            >
                <Plus size={20} /> 录入新案例
            </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-10">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-4 border border-gray-200 rounded-full leading-5 bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg transition-shadow"
            placeholder="搜索关键词：如'掉线'、'配置错误'..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Mobile Upload Button */}
        <div className="md:hidden mb-6 flex justify-center">
             <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md"
            >
                <Plus size={20} /> 录入新案例
            </button>
        </div>

        {/* Results */}
        <div className="space-y-4 pb-20">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Bookmark className="text-indigo-600" size={20}/>
            {searchTerm ? '搜索结果' : '最近收录案例'}
            <span className="text-xs font-normal text-gray-400 ml-2">
                (AI分析将自动参考此处案例)
            </span>
          </h3>
          
          {filteredCases.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500">未找到相关案例</p>
            </div>
          ) : (
            filteredCases.map(ticket => (
              <div key={ticket.id} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4 border-indigo-500 group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{ticket.title}</h4>
                  <span className="text-sm text-gray-400">{new Date(ticket.resolvedAt || ticket.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">{ticket.content}</p>
                
                {ticket.resolution && (
                  <div className="bg-green-50 p-3 rounded text-sm text-green-800 flex items-start gap-2">
                    <FileText size={16} className="mt-0.5 shrink-0" />
                    <span className="whitespace-pre-wrap"><strong>解决方案：</strong>{ticket.resolution}</span>
                  </div>
                )}
                
                <div className="mt-4 flex gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                      ticket.priority === Priority.HIGH ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {ticket.priority} 优先级
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    ID: {ticket.id}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Render Modal */}
      {isUploadModalOpen && <UploadModal />}
    </div>
  );
};

export default CaseLibrary;