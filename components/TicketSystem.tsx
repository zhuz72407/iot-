
import React, { useState, useEffect, useRef } from 'react';
import { Ticket, User, Role, TicketStatus, Urgency, WorkflowStage, Diagnosis, KnowledgeCase } from '../types';
import { analyzeTicketFault, suggestTicketMetadata, askCopilot, checkSimilarTickets } from '../services/geminiService';
import { 
  Plus, 
  Search, 
  BrainCircuit, 
  Bot,
  Send,
  Archive,
  Ticket as TicketIcon,
  Edit3,
  RotateCcw,
  FileText,
  Share2,
  Stethoscope,
  ClipboardCheck,
  CheckCircle,
  Clock,
  Users,
  X,
  AlertCircle,
  Check,
  Filter,
  ArrowUpDown,
  Sparkles,
  Loader2,
  Minimize2,
  Zap,
  Siren,
  ChevronRight,
  MoreHorizontal,
  User as UserIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TicketSystemProps {
  user: User;
  tickets: Ticket[];
  knowledgeCases: KnowledgeCase[];
  onUpdateTicket: (ticket: Ticket) => void;
  onCreateTicket: (ticket: Ticket) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const TicketSystem: React.FC<TicketSystemProps> = ({ user, tickets, knowledgeCases, onUpdateTicket, onCreateTicket }) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Create Modal AI State
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [createFormDescription, setCreateFormDescription] = useState('');
  const [createFormTitle, setCreateFormTitle] = useState('');
  const [createFormUrgency, setCreateFormUrgency] = useState<Urgency>(Urgency.MEDIUM);
  const [aiSuggestionTip, setAiSuggestionTip] = useState<string | null>(null);

  // Cluster Analysis State
  const [clusterResult, setClusterResult] = useState<{ detected: boolean; count: number; reason: string } | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<Urgency | 'ALL'>('ALL');
  
  // Sorting
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  // State for dispatch selection
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedSpecialists, setSelectedSpecialists] = useState<Role[]>([]);
  const [dispatchInstruction, setDispatchInstruction] = useState('');
  
  // State for editing AI analysis
  const [analysisInput, setAnalysisInput] = useState('');
  
  // State for reference selection modal
  const [isRefModalOpen, setIsRefModalOpen] = useState(false);
  const [selectedRefIds, setSelectedRefIds] = useState<string[]>([]);

  // --- COPILOT STATE ---
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotMessages, setCopilotMessages] = useState<ChatMessage[]>([
    { id: 'welcome', sender: 'ai', text: '你好！我是 IoT 技术专家助手。请问有什么可以帮您？我可以协助排查故障代码、查询设备手册或提供处理建议。', timestamp: new Date() }
  ]);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- COPILOT DRAG STATE ---
  const [copilotPos, setCopilotPos] = useState(() => ({ x: window.innerWidth - 100, y: window.innerHeight - 100 }));
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Sync analysis input when ticket changes or AI analysis is updated
  useEffect(() => {
    if (selectedTicket) {
      setAnalysisInput(selectedTicket.aiAnalysis || '');
    }
  }, [selectedTicket]);

  // Scroll Copilot to bottom
  useEffect(() => {
    if (isCopilotOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [copilotMessages, isCopilotOpen]);

  // --- Draggable Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    hasMoved.current = false;
    const widget = e.currentTarget.closest('.copilot-widget') as HTMLElement;
    if (widget) {
      const rect = widget.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        hasMoved.current = true;
        setCopilotPos({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleCopilotClick = () => {
    if (!hasMoved.current) {
      setIsCopilotOpen(!isCopilotOpen);
    }
  };

  // --- Reference Selection Logic ---
  const toggleRefSelection = (id: string) => {
    if (selectedRefIds.includes(id)) {
      setSelectedRefIds(selectedRefIds.filter(refId => refId !== id));
    } else {
      if (selectedRefIds.length < 3) {
        setSelectedRefIds([...selectedRefIds, id]);
      }
    }
  };

  // --- Filtering & Sorting Logic ---
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'ALL' || t.urgency === urgencyFilter;

    let isVisible = false;
    if (user.role === Role.FRONT_DESK) isVisible = true;
    if (user.role === Role.CUSTOMER_RESPONSE) isVisible = true;
    if ([Role.CORE_NET, Role.NET_OPT, Role.TRANS, Role.CORP].includes(user.role)) {
      isVisible = t.assignedTo.includes(user.role) && t.status !== TicketStatus.RESOLVED;
    }
    return matchesSearch && matchesStatus && matchesUrgency && isVisible;
  }).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  // --- Actions ---

  const handleAISuggestion = async () => {
    if (!createFormDescription.trim()) return;
    setIsSuggesting(true);
    setAiSuggestionTip(null);
    setClusterResult(null); 
    
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const activeTickets = tickets.filter(t => 
        t.status !== TicketStatus.RESOLVED && 
        t.createdAt > oneDayAgo
      );

      const [suggestion, cluster] = await Promise.all([
        suggestTicketMetadata(createFormDescription),
        checkSimilarTickets(createFormDescription, activeTickets)
      ]);

      setCreateFormTitle(suggestion.title);
      setCreateFormDescription(suggestion.description);
      setCreateFormUrgency(suggestion.urgency);
      if (suggestion.suggestedRole) {
        setAiSuggestionTip(`AI 建议：该故障可能属于【${suggestion.suggestedRole}】领域。`);
      }

      if (cluster.detected) {
        setClusterResult({
          detected: true,
          count: cluster.similarCount,
          reason: cluster.reason
        });
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleCreateTicket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newTicket: Ticket = {
      id: `TKT-${Math.floor(Math.random() * 10000)}`,
      title: createFormTitle,
      description: createFormDescription,
      urgency: createFormUrgency,
      status: TicketStatus.PENDING,
      stage: WorkflowStage.CREATED,
      creator: user.name,
      createdAt: new Date().toISOString(),
      assignedTo: [Role.CUSTOMER_RESPONSE],
      diagnoses: [],
    };
    onCreateTicket(newTicket);
    setIsCreateModalOpen(false);
  };

  const handleOpenCreateModal = () => {
    setCreateFormTitle('');
    setCreateFormDescription('');
    setCreateFormUrgency(Urgency.MEDIUM);
    setAiSuggestionTip(null);
    setClusterResult(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenDispatchModal = () => {
    setSelectedSpecialists([]);
    setDispatchInstruction(''); 
    setIsDispatchModalOpen(true);
  };

  const toggleSpecialistSelection = (role: Role) => {
    if (selectedSpecialists.includes(role)) {
      setSelectedSpecialists(selectedSpecialists.filter(r => r !== role));
    } else {
      setSelectedSpecialists([...selectedSpecialists, role]);
    }
  };

  const handleConfirmDispatch = () => {
    if (!selectedTicket || selectedSpecialists.length === 0 || !dispatchInstruction.trim()) return;

    const dispatchDiagnosis: Diagnosis = {
      specialistRole: user.role,
      specialistName: user.name,
      content: `【分派意见】${dispatchInstruction}`,
      timestamp: new Date().toISOString()
    };

    const updated: Ticket = {
      ...selectedTicket,
      status: TicketStatus.IN_PROGRESS,
      stage: WorkflowStage.DISPATCHED,
      assignedTo: selectedSpecialists,
      diagnoses: [...selectedTicket.diagnoses, dispatchDiagnosis],
    };
    onUpdateTicket(updated);
    setSelectedTicket(updated);
    setIsDispatchModalOpen(false);
  };

  const handleSubmitDiagnosis = (ticket: Ticket) => {
    if (!diagnosisInput.trim()) return;
    
    const newDiagnosis: Diagnosis = {
      specialistRole: user.role,
      specialistName: user.name,
      content: diagnosisInput,
      timestamp: new Date().toISOString()
    };

    const remainingAssignees = ticket.assignedTo.filter(r => r !== user.role);
    const finalAssignees = remainingAssignees.length === 0 ? [Role.CUSTOMER_RESPONSE] : remainingAssignees;

    const updated: Ticket = {
      ...ticket,
      assignedTo: finalAssignees,
      diagnoses: [...ticket.diagnoses, newDiagnosis],
      stage: WorkflowStage.DIAGNOSED
    };
    
    onUpdateTicket(updated);
    setSelectedTicket(updated);
    setDiagnosisInput('');
  };

  const handleAIAnalysis = async (ticket: Ticket) => {
    setIsAnalyzing(true);
    let historyContextTickets: Ticket[] = [];
    let historyContextCases: KnowledgeCase[] = [];

    if (selectedRefIds.length > 0) {
      const selectedIds = new Set(selectedRefIds);
      historyContextTickets = tickets.filter(t => t.status === TicketStatus.RESOLVED && selectedIds.has(t.id));
      historyContextCases = knowledgeCases.filter(c => selectedIds.has(c.id));
    } else {
      historyContextTickets = tickets.filter(t => t.status === TicketStatus.RESOLVED);
      historyContextCases = knowledgeCases;
    }

    const analysis = await analyzeTicketFault(ticket, historyContextTickets, historyContextCases);
    const updated: Ticket = {
      ...ticket,
      aiAnalysis: analysis,
      stage: WorkflowStage.ANALYZED
    };
    onUpdateTicket(updated);
    setSelectedTicket(updated);
    setIsAnalyzing(false);
    setSelectedRefIds([]);
  };

  const handleSubmitToFrontDesk = (ticket: Ticket) => {
    const updated: Ticket = {
      ...ticket,
      aiAnalysis: analysisInput,
      stage: WorkflowStage.FEEDBACK_PROVIDED,
      assignedTo: [Role.FRONT_DESK],
    };
    onUpdateTicket(updated);
    setSelectedTicket(updated);
  };

  const handleReturnToCR = (ticket: Ticket) => {
    const updated: Ticket = {
      ...ticket,
      status: TicketStatus.IN_PROGRESS,
      stage: WorkflowStage.DIAGNOSED,
      assignedTo: [Role.CUSTOMER_RESPONSE],
    };
    onUpdateTicket(updated);
    setSelectedTicket(updated);
  };

  const handleArchive = (ticket: Ticket) => {
    const updated: Ticket = {
      ...ticket,
      status: TicketStatus.RESOLVED,
      stage: WorkflowStage.ARCHIVED,
      assignedTo: [],
      resolvedAt: new Date().toISOString()
    };
    onUpdateTicket(updated);
    setSelectedTicket(updated);
  };

  const handleCopilotSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!copilotInput.trim()) return;

    const question = copilotInput;
    setCopilotInput('');
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: question, timestamp: new Date() };
    setCopilotMessages(prev => [...prev, userMsg]);
    setIsCopilotThinking(true);

    try {
      const answer = await askCopilot(question, selectedTicket || undefined);
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: answer, timestamp: new Date() };
      setCopilotMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: '抱歉，连接专家服务失败，请稍后重试。', timestamp: new Date() };
      setCopilotMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsCopilotThinking(false);
    }
  };

  const renderWorkflow = (ticket: Ticket) => {
    const workflowSteps = [
      { id: 'start', stage: WorkflowStage.CREATED, icon: FileText, label: '工单受理', role: Role.FRONT_DESK },
      { id: 'dispatch', stage: WorkflowStage.DISPATCHED, icon: Share2, label: '研判分派', role: Role.CUSTOMER_RESPONSE },
      { id: 'diagnose', stage: WorkflowStage.DIAGNOSED, icon: Stethoscope, label: '专业排查', role: '专业班组' },
      { id: 'analysis', stage: WorkflowStage.ANALYZED, icon: BrainCircuit, label: '综合分析', role: Role.CUSTOMER_RESPONSE },
      { id: 'confirm', stage: WorkflowStage.FEEDBACK_PROVIDED, icon: ClipboardCheck, label: '归档确认', role: Role.FRONT_DESK },
      { id: 'end', stage: WorkflowStage.ARCHIVED, icon: CheckCircle, label: '工单完成', role: '系统' }
    ];

    let activeStepIndex = 0;
    if (ticket.stage === WorkflowStage.CREATED) activeStepIndex = ticket.status === TicketStatus.PENDING ? 1 : 0;
    else if (ticket.stage === WorkflowStage.DISPATCHED) activeStepIndex = 2;
    else if (ticket.stage === WorkflowStage.DIAGNOSED) activeStepIndex = 3;
    else if (ticket.stage === WorkflowStage.ANALYZED) activeStepIndex = 3;
    else if (ticket.stage === WorkflowStage.FEEDBACK_PROVIDED) activeStepIndex = 4;
    else if (ticket.stage === WorkflowStage.ARCHIVED) activeStepIndex = 5;
    
    if (ticket.status === TicketStatus.PENDING) activeStepIndex = 1;

    return (
      <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-500" /> 流程监控
          </h3>
          <div className="flex gap-4 text-[10px] font-medium uppercase tracking-wider text-slate-400">
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> 已完成</div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> 进行中</div>
          </div>
        </div>
        <div className="relative flex justify-between px-2">
           <div className="absolute top-[26px] left-0 w-full px-8">
              <div className="h-1 bg-slate-100 w-full rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-emerald-400 to-blue-500 transition-all duration-700 ease-in-out" style={{ width: `${(activeStepIndex / (workflowSteps.length - 1)) * 100}%` }}></div>
              </div>
           </div>
           {workflowSteps.map((step, idx) => {
             let state: 'completed' | 'active' | 'pending' = 'pending';
             if (idx < activeStepIndex) state = 'completed';
             else if (idx === activeStepIndex) state = 'active';
             if (ticket.stage === WorkflowStage.ARCHIVED) state = 'completed';
             const Icon = step.icon;
             return (
               <div key={step.id} className="relative z-10 flex flex-col items-center w-1/6 group">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 transition-all duration-300 shadow-sm ${state === 'completed' ? 'bg-white border-emerald-500 text-emerald-600' : state === 'active' ? 'bg-blue-500 border-blue-200 text-white shadow-lg scale-110' : 'bg-white border-slate-100 text-slate-300'}`}>
                   {state === 'completed' ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                 </div>
                 <div className={`mt-3 text-center transition-colors ${state === 'active' ? 'text-blue-700 font-bold' : state === 'completed' ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                   <div className="text-xs">{step.label}</div>
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    );
  };

  const specialistRoles = [Role.CORE_NET, Role.NET_OPT, Role.TRANS, Role.CORP];

  return (
    <div className="h-full flex bg-slate-50">
      <div className="w-96 bg-white flex flex-col h-full border-r border-slate-200 shadow-sm z-10">
        <div className="p-4 space-y-3 bg-white z-20 shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">工单中心</h2>
            {user.role === Role.FRONT_DESK && <button onClick={handleOpenCreateModal} className="bg-brand-600 text-white p-2 rounded-xl hover:bg-brand-700 transition active:scale-95"><Plus className="w-5 h-5" /></button>}
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
            <input type="text" placeholder="搜索工单..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'ALL')} className="flex-1 py-2 px-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-600">
              <option value="ALL">所有状态</option>
              <option value={TicketStatus.PENDING}>待处理</option>
              <option value={TicketStatus.IN_PROGRESS}>处理中</option>
              <option value={TicketStatus.RESOLVED}>已处理</option>
            </select>
            <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value as Urgency | 'ALL')} className="flex-1 py-2 px-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-600">
              <option value="ALL">所有紧急度</option>
              <option value={Urgency.HIGH}>高</option>
              <option value={Urgency.MEDIUM}>中</option>
              <option value={Urgency.LOW}>低</option>
            </select>
            <button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className="px-2.5 py-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500"><ArrowUpDown className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400"><Search className="w-12 h-12 mb-3 text-slate-200" /><p className="text-sm font-medium">没有找到符合条件的工单</p></div>
          ) : (
            filteredTickets.map(ticket => (
                <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className={`relative p-4 rounded-xl cursor-pointer border ${selectedTicket?.id === ticket.id ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}>
                  <div className="flex justify-between items-start mb-2"><span className={`font-bold text-sm line-clamp-1 ${selectedTicket?.id === ticket.id ? 'text-blue-900' : 'text-slate-700'}`}>{ticket.title}</span><span className="text-[10px] text-slate-400 font-mono">{new Date(ticket.createdAt).toLocaleDateString([], {month:'2-digit', day:'2-digit'})}</span></div>
                  <div className="flex items-center gap-2 mb-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ticket.urgency === Urgency.HIGH ? 'bg-red-50 text-red-600 border-red-100' : ticket.urgency === Urgency.MEDIUM ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{ticket.urgency}</span><span className="text-[10px] px-2 py-0.5 rounded border border-slate-200 text-slate-500">{ticket.status}</span></div>
                  <p className="text-xs text-slate-500 line-clamp-2">{ticket.description}</p>
                </div>
              ))
          )}
        </div>
      </div>
      <div className="flex-1 h-full overflow-y-auto relative">
        {selectedTicket ? (
          <div className="min-h-full pb-24">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
               <div className="max-w-5xl mx-auto px-8 py-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2"><h1 className="text-2xl font-bold text-slate-800">{selectedTicket.title}</h1><span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">{selectedTicket.status}</span></div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{selectedTicket.id}</span>
                        <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> 发起人: {selectedTicket.creator}</span>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
            <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">
              {renderWorkflow(selectedTicket)}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 uppercase tracking-wider"><FileText className="w-4 h-4 text-slate-400" /> 故障详述</h3><p className="text-slate-600 leading-relaxed text-sm">{selectedTicket.description}</p></div>
              <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-6 uppercase tracking-wider px-2"><Stethoscope className="w-4 h-4 text-slate-400" /> 诊断记录与进度</h3>
                  <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pl-8 pb-4">
                      {selectedTicket.diagnoses.map((d, idx) => (
                          <div key={idx} className="relative group">
                            <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center z-10 group-hover:border-indigo-500 transition-colors"><div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors"></div></div>
                            <div className="flex flex-col sm:flex-row sm:items-start gap-3"><div className="flex items-center gap-2 sm:w-32 flex-shrink-0 pt-0.5"><span className="font-bold text-slate-700 text-sm">{d.specialistRole.split('专业')[0]}</span></div><div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative"><p className="text-sm text-slate-700 leading-relaxed">{d.content}</p><span className="text-[10px] text-slate-300 absolute top-2 right-3 font-mono">{new Date(d.timestamp).toLocaleString([], {hour: '2-digit', minute:'2-digit'})}</span></div></div>
                          </div>
                      ))}
                      {specialistRoles.includes(user.role) && selectedTicket.assignedTo.includes(user.role) && selectedTicket.status !== TicketStatus.RESOLVED && (
                        <div className="relative pt-4"><div className="absolute -left-[43px] top-4 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md z-10 animate-bounce"><Edit3 className="w-3.5 h-3.5" /></div><div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100"><label className="text-xs font-bold text-indigo-900 mb-2 block">填写诊断意见 ({user.role})</label><textarea className="w-full p-3 border border-indigo-200 rounded-xl focus:outline-none bg-white min-h-[100px] text-sm" placeholder="请输入排查结果..." value={diagnosisInput} onChange={(e) => setDiagnosisInput(e.target.value)} /><div className="mt-3 flex justify-end"><button onClick={() => handleSubmitDiagnosis(selectedTicket)} disabled={!diagnosisInput.trim()} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2"><Send className="w-3.5 h-3.5" /> 提交诊断</button></div></div></div>
                      )}
                  </div>
              </div>
              <div className="bg-gradient-to-br from-white to-purple-50 p-8 rounded-2xl shadow-sm border border-purple-100 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6"><h3 className="text-base font-bold text-purple-900 flex items-center gap-2"><div className="p-2 bg-purple-100 rounded-lg"><BrainCircuit className="w-5 h-5 text-purple-600" /></div>智能综判分析</h3>{user.role === Role.CUSTOMER_RESPONSE && selectedTicket.status !== TicketStatus.RESOLVED && (<div className="flex gap-2"><button onClick={() => setIsRefModalOpen(true)} className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg">参考案例</button><button onClick={() => handleAIAnalysis(selectedTicket)} disabled={isAnalyzing} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg shadow-md">{isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}{selectedTicket.aiAnalysis ? '重新生成' : '智能生成'}</button></div>)}</div>
                    <div className="bg-white rounded-xl p-6 border border-purple-50 shadow-sm min-h-[200px]">{selectedTicket.aiAnalysis ? (user.role === Role.CUSTOMER_RESPONSE && selectedTicket.status !== TicketStatus.RESOLVED ? (<textarea value={analysisInput} onChange={(e) => setAnalysisInput(e.target.value)} className="w-full h-[300px] p-4 border border-purple-200 rounded-xl text-sm bg-white" />) : (<div className="prose prose-sm prose-purple max-w-none"><ReactMarkdown>{selectedTicket.aiAnalysis}</ReactMarkdown></div>)) : (<div className="text-center py-12"><Bot className="w-12 h-12 mx-auto text-purple-200 mb-4" /><p className="text-slate-500 font-medium">暂无 AI 分析报告</p></div>)}</div>
                </div>
              </div>
            </div>
            <div className="fixed bottom-0 right-0 left-96 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-40 flex justify-end gap-3 shadow-md">
               {user.role === Role.CUSTOMER_RESPONSE && selectedTicket.status !== TicketStatus.RESOLVED && (
                 <>
                   {(selectedTicket.status === TicketStatus.PENDING || selectedTicket.assignedTo.includes(Role.CUSTOMER_RESPONSE)) && (<button onClick={handleOpenDispatchModal} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg text-sm"><Share2 className="w-4 h-4" />{selectedTicket.diagnoses.length > 0 ? '再次分派' : '分派任务'}</button>)}
                   {selectedTicket.status === TicketStatus.IN_PROGRESS && selectedTicket.assignedTo.includes(Role.CUSTOMER_RESPONSE) && (<button onClick={() => handleSubmitToFrontDesk(selectedTicket)} disabled={!selectedTicket.aiAnalysis} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold shadow-lg text-sm disabled:opacity-50"><Send className="w-4 h-4" />提交给前台</button>)}
                 </>
               )}
               {user.role === Role.FRONT_DESK && selectedTicket.stage === WorkflowStage.FEEDBACK_PROVIDED && selectedTicket.status !== TicketStatus.RESOLVED && (<><button onClick={() => handleReturnToCR(selectedTicket)} className="px-5 py-2.5 bg-amber-100 text-amber-700 rounded-xl font-bold text-sm">退回排查</button><button onClick={() => handleArchive(selectedTicket)} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg text-sm">确认归档</button></>)}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400"><div className="w-20 h-20 bg-white border border-slate-100 rounded-full flex items-center justify-center mb-4"><MoreHorizontal className="w-8 h-8 text-slate-300" /></div><p className="text-sm font-medium text-slate-500">选择左侧工单查看详情</p></div>
        )}
      </div>
      <div className={`fixed z-50 flex flex-col items-end gap-4 copilot-widget ${isCopilotOpen ? 'w-96' : 'w-auto'}`} style={{ left: copilotPos.x, top: copilotPos.y }}>
         {isCopilotOpen && (
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full h-[500px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
               <div className="bg-slate-900 text-white p-4 flex justify-between items-center cursor-move" onMouseDown={handleMouseDown}><div className="flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400" /><h3 className="font-bold text-sm">IoT 技术专家助手</h3></div><button onClick={() => setIsCopilotOpen(false)} className="p-1"><Minimize2 className="w-4 h-4 text-slate-400" /></button></div>
                <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4">
                  {copilotMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
                        {msg.sender === 'ai' ? (
                          <div className="markdown-body prose prose-sm max-w-none">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        ) : (msg.text)}
                      </div>
                    </div>
                  ))}
                  {isCopilotThinking && (
                    <div className="flex justify-start">
                      <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        <span className="text-xs text-slate-500">正在思考...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
               <form onSubmit={handleCopilotSend} className="p-3 bg-white border-t border-slate-100"><div className="relative flex items-center gap-2"><input type="text" value={copilotInput} onChange={(e) => setCopilotInput(e.target.value)} placeholder="输入技术问题..." className="flex-1 px-4 py-2 bg-slate-100 rounded-xl focus:outline-none text-sm" /><button type="submit" disabled={!copilotInput.trim() || isCopilotThinking} className="p-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50"><Send className="w-4 h-4" /></button></div></form>
            </div>
         )}
         {!isCopilotOpen && (<button onMouseDown={handleMouseDown} onClick={handleCopilotClick} className="group relative flex items-center justify-center bg-slate-900 text-white w-12 h-12 rounded-full shadow-lg border border-slate-700 cursor-move"><Zap className="w-5 h-5 text-cyan-400" /></button>)}
      </div>
      {isDispatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95"><div className="p-5 border-b flex justify-between items-center"><h3>选择派单班组</h3><button onClick={() => setIsDispatchModalOpen(false)}>✕</button></div><div className="p-6 space-y-3">{specialistRoles.map((role) => (<label key={role} onClick={() => toggleSpecialistSelection(role)} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer ${selectedSpecialists.includes(role) ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100'}`}><input type="checkbox" checked={selectedSpecialists.includes(role)} readOnly className="mr-3" /><div className="flex-1 font-bold">{role}</div></label>))}<div><label className="block text-sm font-bold text-slate-700 mb-2">任务说明 *</label><textarea value={dispatchInstruction} onChange={(e) => setDispatchInstruction(e.target.value)} className="w-full p-3 border rounded-xl text-sm min-h-[80px]" /></div></div><div className="p-4 bg-slate-50 flex justify-end gap-3"><button onClick={() => setIsDispatchModalOpen(false)}>取消</button><button onClick={handleConfirmDispatch} disabled={selectedSpecialists.length === 0 || !dispatchInstruction.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50">分派任务</button></div></div>
        </div>
      )}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95"><div className="p-6 border-b flex justify-between items-center"><h3>新建工单</h3><button onClick={() => setIsCreateModalOpen(false)}>✕</button></div><form onSubmit={handleCreateTicket} className="p-8 space-y-6"><div><div className="flex justify-between items-center mb-2"><label className="block text-sm font-bold text-slate-700">详细描述</label><button type="button" onClick={handleAISuggestion} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 disabled:opacity-50">{isSuggesting ? '识别中...' : 'AI 填单'}</button></div><textarea value={createFormDescription} onChange={(e) => setCreateFormDescription(e.target.value)} required rows={4} className="w-full p-3 border rounded-xl text-sm" /></div>{aiSuggestionTip && (<div className="bg-violet-50 text-violet-700 text-xs px-4 py-3 rounded-lg flex items-start gap-2 border border-violet-100 animate-in fade-in slide-in-from-top-2"><Bot className="w-4 h-4 mt-0.5" />{aiSuggestionTip}</div>)}{clusterResult && clusterResult.detected && (<div className="bg-amber-50 text-amber-800 text-xs px-4 py-3 rounded-lg border border-amber-200"><p className="font-bold">⚠️ 疑似聚类: {clusterResult.reason}</p></div>)}<div><label className="block text-sm font-bold text-slate-700 mb-2">工单标题</label><input value={createFormTitle} onChange={(e) => setCreateFormTitle(e.target.value)} required type="text" className="w-full p-3 border rounded-xl text-sm" /></div><div className="flex justify-end gap-3"><button type="button" onClick={() => setIsCreateModalOpen(false)}>取消</button><button type="submit" className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-bold">创建</button></div></form></div>
        </div>
      )}
    </div>
  );
};
