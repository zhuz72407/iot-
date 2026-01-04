
import React, { useState } from 'react';
import { Ticket, TicketStatus, KnowledgeCase, User } from '../types';
import { Search, FileText, Calendar, UploadCloud, Plus, X, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface KnowledgeBaseProps {
  user: User;
  tickets: Ticket[];
  manualCases: KnowledgeCase[];
  onAddCase: (newCase: KnowledgeCase) => void;
}

// Unified display interface for the list
interface DisplayCase {
  id: string;
  title: string;
  description: string;
  solution: string; // Maps to aiAnalysis for tickets, solution for manual cases
  tags?: string[];
  createdAt: string;
  type: 'AUTO' | 'MANUAL';
  source: string; // Creator name or 'System'
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ user, tickets, manualCases, onAddCase }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Transform archived tickets to DisplayCase
  const archivedCases: DisplayCase[] = tickets
    .filter(t => t.status === TicketStatus.RESOLVED)
    .map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      solution: t.aiAnalysis || '暂无分析',
      createdAt: t.createdAt,
      type: 'AUTO',
      source: t.creator
    }));

  // Transform manual cases to DisplayCase
  const uploadedCases: DisplayCase[] = manualCases.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    solution: c.solution,
    tags: c.tags,
    createdAt: c.createdAt,
    type: 'MANUAL',
    source: c.uploader
  }));

  // Combine and Sort
  const allCases = [...archivedCases, ...uploadedCases].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Filter
  const filteredCases = allCases.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.solution.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleUploadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tagsStr = formData.get('tags') as string;
    
    const newCase: KnowledgeCase = {
      id: `KB-${Math.floor(Math.random() * 10000)}`,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      solution: formData.get('solution') as string,
      tags: tagsStr.split(/[,，]/).map(t => t.trim()).filter(Boolean),
      uploader: user.name,
      createdAt: new Date().toISOString()
    };
    
    onAddCase(newCase);
    setIsUploadModalOpen(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col items-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">案例知识库</h2>
        <p className="text-slate-500 mb-6">搜索历史工单自动归档及专家上传的经验案例</p>
        
        <div className="w-full flex justify-between items-center max-w-4xl">
           <div className="relative flex-1 mr-4">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索关键字、问题描述、解决方案或标签..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-md transition transform hover:-translate-y-0.5"
          >
            <UploadCloud className="w-5 h-5" />
            上传案例
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {filteredCases.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>库中未找到匹配的案例。</p>
          </div>
        ) : (
          filteredCases.map(kCase => (
            <div key={kCase.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                    {kCase.title}
                    {kCase.tags && kCase.tags.map(tag => (
                      <span key={tag} className="text-xs font-normal px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full flex items-center gap-0.5">
                        <Tag className="w-3 h-3" /> {tag}
                      </span>
                    ))}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(kCase.createdAt).toLocaleDateString()}</span>
                    <span className="font-mono bg-slate-100 px-1 rounded text-xs">{kCase.id}</span>
                    <span>来源: {kCase.source}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  kCase.type === 'AUTO' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {kCase.type === 'AUTO' ? '自动归档' : '专家上传'}
                </span>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2 uppercase text-xs tracking-wider">问题/故障描述</h4>
                  <p className="text-slate-600 text-sm whitespace-pre-wrap">{kCase.description}</p>
                </div>

                <div className={`rounded-lg p-4 border ${kCase.type === 'AUTO' ? 'bg-purple-50 border-purple-100' : 'bg-blue-50 border-blue-100'}`}>
                   <h4 className={`font-bold mb-3 flex items-center gap-2 ${kCase.type === 'AUTO' ? 'text-purple-900' : 'text-blue-900'}`}>
                     {kCase.type === 'AUTO' ? 'AI / 综合解决方案' : '专家解决建议'}
                   </h4>
                   <div className={`prose prose-sm max-w-none text-slate-700 ${kCase.type === 'AUTO' ? 'prose-purple' : 'prose-blue'}`}>
                     <ReactMarkdown>
                       {kCase.solution}
                     </ReactMarkdown>
                   </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <UploadCloud className="w-6 h-6 text-brand-600" />
                上传新案例
              </h3>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">案例标题</label>
                <input name="title" required type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition shadow-sm" placeholder="简明扼要的故障名称" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">标签 (用逗号分隔)</label>
                <input name="tags" type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition shadow-sm" placeholder="例如: 5G, 核心网, 断站" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">故障详细描述</label>
                <textarea name="description" required rows={4} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition shadow-sm" placeholder="发生时间、现象、影响范围等..." />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">解决方案与分析</label>
                <textarea name="solution" required rows={6} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition shadow-sm font-mono text-sm" placeholder="请支持 Markdown 格式..." />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition">取消</button>
                <button type="submit" className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-200 transition transform hover:-translate-y-0.5">保存案例</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
