
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
  CheckCircle as CheckCircleFilled,
  Check,
  Filter,
  ArrowUpDown,
  Sparkles,
  Loader2,
  MessageSquareText,
  Minimize2,
  Zap,
  Siren,
  ChevronRight,
  MoreHorizontal,
  User as UserIcon,
  GripHorizontal
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
  const [dispatchInstruction, setDispatchInstruction] = useState(''); // New: Dispatch Instruction
  
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
  // Initial position: bottom-right
  const [copilotPos, setCopilotPos] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
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
    // Calculate offset from the top-left of the container
    const rect = (e.currentTarget.closest('.copilot-widget') as HTMLElement).getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
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
    // Basic search
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.includes(searchTerm);
    
    // Status Filter
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

    // Urgency Filter
    const matchesUrgency = urgencyFilter === 'ALL' || t.urgency === urgencyFilter;

    // Role based visibility
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
    setCreateFormTitle('');
    setCreateFormDescription('');
    setCreateFormUrgency(Urgency.MEDIUM);
    setAiSuggestionTip(null);
    setClusterResult(null);
  };

  const handleOpenCreateModal = () => {
    setCreateFormTitle('');
    setCreateFormDescription('');
    setCreateFormUrgency(Urgency.MEDIUM);
    setAiSuggestionTip(null);
    setClusterResult(null);
    setIsCreateModalOpen(true);
  }

  const handleOpenDispatchModal = () => {
    setSelectedSpecialists([]);
    setDispatchInstruction(''); // Reset instruction
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
    // Validate required fields
    if (!selectedTicket || selectedSpecialists.length === 0 || !dispatchInstruction.trim()) return;

    // Create a new diagnosis entry for the dispatch instruction
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


  // --- Render Helpers ---

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
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> 已完成</div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> 进行中</div>
          </div>
        </div>

        <div className="relative flex justify-between px-2">
           <div className="absolute top-[26px] left-0 w-full px-8">
              <div className="h-1 bg-slate-100 w-full rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-gradient-to-r from-emerald-400 to-blue-500 transition-all duration-700 ease-in-out"
                   style={{ width: `${(activeStepIndex / (workflowSteps.length - 1)) * 100}%` }}
                 ></div>
              </div>
           </div>

           {workflowSteps.map((step, idx) => {
             let state: 'completed' | 'active' | 'pending' = 'pending';
             if (idx < activeStepIndex) state = 'completed';
             else if (idx === activeStepIndex) state = 'active';
             if (ticket.stage === WorkflowStage.ARCHIVED) state = 'completed';

             const Icon = step.icon;
             const isReturned = ticket.stage === WorkflowStage.DIAGNOSED && idx === 3 && ticket.assignedTo.includes(Role.CUSTOMER_RESPONSE) && ticket.diagnoses.length > 0;

             return (
               <div key={step.id} className="relative z-10 flex flex-col items-center w-1/6 group">
                 <div 
                   className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 transition-all duration-300 shadow-sm ${
                     state === 'completed' ? 'bg-white border-emerald-500 text-emerald-600' :
                     state === 'active' ? 'bg-blue-500 border-blue-200 text-white shadow-blue-200 shadow-lg scale-110' :
                     'bg-white border-slate-100 text-slate-300'
                   }`}
                 >
                   {state === 'completed' ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                 </div>
                 {isReturned && state === 'active' && (
                   <div className="absolute top-0 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white border-2 border-white animate-pulse">
                     <RotateCcw className="w-3 h-3" />
                   </div>
                 )}
                 <div className={`mt-3 text-center transition-colors ${
                   state === 'active' ? 'text-blue-700 font-bold' : 
                   state === 'completed' ? 'text-slate-700 font-medium' : 'text-slate-400'
                 }`}>
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
      
      {/* --- SIDEBAR LIST --- */}
      <div className="w-96 bg-white flex flex-col h-full border-r border-slate-200 shadow-sm z-10">
        
        {/* Header Search & Actions */}
        <div className="p-4 space-y-3 bg-white z-20 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">工单中心</h2>
            {user.role === Role.FRONT_DESK && (
              <button 
                onClick={handleOpenCreateModal}
                className="bg-brand-600 text-white p-2 rounded-xl hover:bg-brand-700 transition shadow-lg shadow-brand-200 active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
            <input 
              type="text" 
              placeholder="搜索工单..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'ALL')}
                className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="ALL">所有状态</option>
                <option value={TicketStatus.PENDING}>待处理</option>
                <option value={TicketStatus.IN_PROGRESS}>处理中</option>
                <option value={TicketStatus.RESOLVED}>已处理</option>
              </select>
            </div>
            <div className="relative flex-1">
              <AlertCircle className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select 
                value={urgencyFilter} 
                onChange={(e) => setUrgencyFilter(e.target.value as Urgency | 'ALL')}
                className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="ALL">所有紧急度</option>
                <option value={Urgency.HIGH}>高优先级</option>
                <option value={Urgency.MEDIUM}>中优先级</option>
                <option value={Urgency.LOW}>低优先级</option>
              </select>
            </div>
            <button 
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="px-2.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Search className="w-12 h-12 mb-3 text-slate-200" />
              <p className="text-sm font-medium">没有找到符合条件的工单</p>
            </div>
          ) : (
            filteredTickets.map(ticket => {
               const isActive = selectedTicket?.id === ticket.id;
               const isAssignedToMe = ticket.assignedTo.includes(user.role) && ticket.status !== TicketStatus.RESOLVED;

               return (
                <div 
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                    isActive 
                      ? 'bg-blue-50/50 border-blue-200 shadow-sm' 
                      : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'
                  }`}
                >
                  {/* Active Indicator Strip */}
                  {isActive && <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full"></div>}
                  
                  <div className="flex justify-between items-start mb-2 pl-2">
                    <span className={`font-bold text-sm line-clamp-1 ${isActive ? 'text-blue-900' : 'text-slate-700'}`}>
                      {ticket.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap ml-2">
                      {new Date(ticket.createdAt).toLocaleDateString([], {month:'2-digit', day:'2-digit'})}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3 pl-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      ticket.urgency === Urgency.HIGH ? 'bg-red-50 text-red-600 border-red-100' : 
                      ticket.urgency === Urgency.MEDIUM ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {ticket.urgency}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                       ticket.status === TicketStatus.RESOLVED ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white text-slate-500 border-slate-200'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 pl-2 mb-2 leading-relaxed">
                    {ticket.description}
                  </p>

                  {isAssignedToMe && (
                     <div className="flex items-center gap-1.5 pl-2 mt-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-brand-600">待处理</span>
                     </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- DETAIL VIEW --- */}
      <div className="flex-1 h-full overflow-y-auto relative">
        {selectedTicket ? (
          <div className="min-h-full pb-24">
            {/* Header Banner */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)]">
               <div className="max-w-5xl mx-auto px-8 py-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-slate-800">{selectedTicket.title}</h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            selectedTicket.status === TicketStatus.RESOLVED ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                            selectedTicket.status === TicketStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                          }`}>
                            {selectedTicket.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                          {selectedTicket.id}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3" /> 发起人: {selectedTicket.creator}
                        </span>
                        {selectedTicket.status !== TicketStatus.RESOLVED && (
                           <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                             <span className="uppercase tracking-wider font-bold text-[10px] text-slate-400">当前处理:</span>
                             {selectedTicket.assignedTo.length > 0 ? selectedTicket.assignedTo.map((role, idx) => (
                               <span key={idx} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium border border-indigo-100">
                                 {role}
                               </span>
                             )) : <span className="text-slate-400 italic">未分配</span>}
                           </div>
                        )}
                      </div>
                    </div>
                    {/* Action Hint */}
                    {selectedTicket.assignedTo.includes(user.role) && selectedTicket.status !== TicketStatus.RESOLVED && (
                       <div className="bg-brand-50 text-brand-700 px-4 py-2 rounded-xl text-xs font-bold border border-brand-100 flex items-center gap-2 animate-pulse">
                          <Clock className="w-4 h-4" />
                          请及时处理
                       </div>
                    )}
                  </div>
               </div>
            </div>

            <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">
              
              {/* Workflow */}
              {renderWorkflow(selectedTicket)}

              {/* 1. Description Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 uppercase tracking-wider">
                      <FileText className="w-4 h-4 text-slate-400" /> 故障详述
                  </h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
                      {selectedTicket.description}
                  </p>
              </div>

              {/* 2. Diagnosis Timeline */}
              <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-6 uppercase tracking-wider px-2">
                      <Stethoscope className="w-4 h-4 text-slate-400" /> 诊断记录与进度
                  </h3>
                  
                  <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pl-8 pb-4">
                      {selectedTicket.diagnoses.length === 0 && (
                          <div className="text-slate-400 italic text-sm">暂无诊断记录</div>
                      )}
                      
                      {selectedTicket.diagnoses.map((d, idx) => (
                          <div key={idx} className="relative group">
                            {/* Timeline Dot */}
                            <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center z-10 group-hover:border-indigo-500 transition-colors">
                                <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors"></div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                <div className="flex items-center gap-2 sm:w-32 flex-shrink-0 pt-0.5">
                                  <span className="font-bold text-slate-700 text-sm">{d.specialistRole.split('专业')[0]}</span>
                                  <span className="text-xs text-slate-400">{d.specialistName}</span>
                                </div>
                                <div className="flex-1 bg-white p-4 rounded-xl rounded-tl-none border border-slate-200 shadow-sm relative">
                                  <p className="text-sm text-slate-700 leading-relaxed">{d.content}</p>
                                  <span className="text-[10px] text-slate-300 absolute top-2 right-3 font-mono">
                                      {new Date(d.timestamp).toLocaleString([], {hour: '2-digit', minute:'2-digit', month: '2-digit', day: '2-digit'})}
                                  </span>
                                </div>
                            </div>
                          </div>
                      ))}

                      {/* Diagnosis Input - Appears at the end of timeline */}
                      {[Role.CORE_NET, Role.NET_OPT, Role.TRANS, Role.CORP].includes(user.role) && 
                        selectedTicket.assignedTo.includes(user.role) &&
                        selectedTicket.status !== TicketStatus.RESOLVED && (
                        <div className="relative pt-4">
                            <div className="absolute -left-[43px] top-4 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md z-10 animate-bounce">
                                <Edit3 className="w-3.5 h-3.5" />
                            </div>
                            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-300">
                                <label className="text-xs font-bold text-indigo-900 mb-2 block">
                                  填写诊断意见 ({user.role})
                                </label>
                                <textarea 
                                  className="w-full p-3 border border-indigo-200 rounded-xl focus:outline-none bg-white min-h-[100px] text-sm"
                                  placeholder="请输入详细排查结果..."
                                  value={diagnosisInput}
                                  onChange={(e) => setDiagnosisInput(e.target.value)}
                                />
                                <div className="mt-3 flex justify-end">
                                <button 
                                  onClick={() => handleSubmitDiagnosis(selectedTicket)}
                                  disabled={!diagnosisInput.trim()}
                                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-indigo-200 flex items-center gap-2"
                                >
                                  <Send className="w-3.5 h-3.5" /> 提交诊断
                                </button>
                                </div>
                            </div>
                        </div>
                      )}
                  </div>
              </div>

              {/* 3. AI Analysis (Intelligent Comprehensive Judgment) - Moved to Bottom */}
              <div className="bg-gradient-to-br from-white to-purple-50/30 p-8 rounded-2xl shadow-sm border border-purple-100 relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-base font-bold text-purple-900 flex items-center gap-2">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <BrainCircuit className="w-5 h-5 text-purple-600" />
                            </div>
                            智能综判分析
                        </h3>
                        {user.role === Role.CUSTOMER_RESPONSE && selectedTicket.status !== TicketStatus.RESOLVED && (
                            <div className="flex gap-2">
                                <button
                                  onClick={() => setIsRefModalOpen(true)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition"
                                  title="选择参考案例"
                                >
                                    <Search className="w-3.5 h-3.5" /> 参考案例
                                </button>
                                <button
                                  onClick={() => handleAIAnalysis(selectedTicket)}
                                  disabled={isAnalyzing}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition shadow-md shadow-purple-200"
                                  title="生成/重新生成报告"
                                >
                                    {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    {selectedTicket.aiAnalysis ? '重新生成' : '智能生成'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-purple-50 shadow-sm min-h-[200px]">
                        {selectedTicket.aiAnalysis ? (
                            user.role === Role.CUSTOMER_RESPONSE && selectedTicket.status !== TicketStatus.RESOLVED ? (
                              <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                      <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">编辑模式</div>
                                  </div>
                                  <textarea
                                    value={analysisInput}
                                    onChange={(e) => setAnalysisInput(e.target.value)}
                                    className="w-full h-[300px] p-4 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500/30 focus:outline-none text-sm bg-white/80 leading-relaxed resize-y"
                                  />
                              </div>
                            ) : (
                              <div className="prose prose-sm prose-purple max-w-none prose-headings:font-bold prose-headings:text-purple-900 prose-p:text-slate-600">
                                <ReactMarkdown>{selectedTicket.aiAnalysis}</ReactMarkdown>
                              </div>
                            )
                        ) : (
                            <div className="text-center py-12">
                              <Bot className="w-12 h-12 mx-auto text-purple-200 mb-4" />
                              <p className="text-slate-500 font-medium mb-2">暂无 AI 分析报告</p>
                              <p className="text-xs text-slate-400">请点击右上角按钮生成智能分析</p>
                            </div>
                        )}
                    </div>
                </div>
              </div>

            </div>

            {/* Sticky Actions Bar */}
            <div className="fixed bottom-0 right-0 left-96 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-40 flex justify-end gap-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
               {user.role === Role.CUSTOMER_RESPONSE && selectedTicket.status !== TicketStatus.RESOLVED && (
                 <>
                   {(selectedTicket.status === TicketStatus.PENDING || selectedTicket.assignedTo.includes(Role.CUSTOMER_RESPONSE)) && (
                     <button 
                       onClick={handleOpenDispatchModal}
                       className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200/50 transition transform hover:-translate-y-0.5 active:scale-95 text-sm"
                     >
                       <Share2 className="w-4 h-4" />
                       {selectedTicket.diagnoses.length > 0 ? '再次分派' : '分派任务'}
                     </button>
                   )}
                   
                   {selectedTicket.status === TicketStatus.IN_PROGRESS && selectedTicket.assignedTo.includes(Role.CUSTOMER_RESPONSE) && (
                     <button 
                       onClick={() => handleSubmitToFrontDesk(selectedTicket)}
                       disabled={!selectedTicket.aiAnalysis}
                       className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200/50 transition transform hover:-translate-y-0.5 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                     >
                       <Send className="w-4 h-4" />
                       提交给前台
                     </button>
                   )}
                 </>
               )}

               {user.role === Role.FRONT_DESK && selectedTicket.stage === WorkflowStage.FEEDBACK_PROVIDED && selectedTicket.status !== TicketStatus.RESOLVED && (
                   <>
                      <button 
                       onClick={() => handleReturnToCR(selectedTicket)}
                       className="flex items-center gap-2 px-5 py-2.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-xl font-bold hover:bg-amber-200 transition text-sm"
                     >
                       <RotateCcw className="w-4 h-4" />
                       退回排查
                     </button>
                     <button 
                       onClick={() => handleArchive(selectedTicket)}
                       className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 transition transform hover:-translate-y-0.5 active:scale-95 text-sm"
                     >
                       <Archive className="w-4 h-4" />
                       确认归档
                     </button>
                   </>
               )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <div className="w-20 h-20 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-4">
               <MoreHorizontal className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">选择左侧工单查看详情</p>
          </div>
        )}
      </div>

      {/* EXPERT COPILOT WIDGET */}
      <div 
        className={`fixed z-50 flex flex-col items-end gap-4 transition-all duration-300 copilot-widget ${isCopilotOpen ? 'w-96' : 'w-auto'}`}
        style={{ left: copilotPos.x, top: copilotPos.y }}
      >
         
         {isCopilotOpen && (
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full h-[500px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
               <div 
                 className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md cursor-move"
                 onMouseDown={handleMouseDown}
               >
                  <div className="flex items-center gap-2">
                     <div className="bg-cyan-500 p-1 rounded-lg">
                       <Zap className="w-4 h-4 text-white" />
                     </div>
                     <div>
                       <h3 className="font-bold text-sm">IoT 技术专家助手</h3>
                       {selectedTicket && <p className="text-[10px] text-slate-400 flex items-center gap-1"><Share2 className="w-3 h-3"/> 已关联当前工单</p>}
                     </div>
                  </div>
                  <button onClick={() => setIsCopilotOpen(false)} className="hover:bg-slate-700 p-1 rounded transition">
                     <Minimize2 className="w-4 h-4 text-slate-400" />
                  </button>
               </div>
               
               <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4">
                  {copilotMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          msg.sender === 'user' 
                             ? 'bg-blue-600 text-white rounded-br-none' 
                             : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                       }`}>
                          {msg.sender === 'ai' ? (
                             <ReactMarkdown className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                                {msg.text}
                             </ReactMarkdown>
                          ) : (
                             msg.text
                          )}
                       </div>
                    </div>
                  ))}
                  {isCopilotThinking && (
                    <div className="flex justify-start">
                       <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          <span className="text-xs text-slate-500">正在思考...</span>
                       </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
               </div>

               <form onSubmit={handleCopilotSend} className="p-3 bg-white border-t border-slate-100">
                  <div className="relative flex items-center gap-2">
                     <input 
                       type="text" 
                       value={copilotInput}
                       onChange={(e) => setCopilotInput(e.target.value)}
                       placeholder={selectedTicket ? "针对当前工单提问..." : "输入技术问题..."}
                       className="flex-1 pl-4 pr-10 py-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition-all"
                     />
                     <button 
                       type="submit" 
                       disabled={!copilotInput.trim() || isCopilotThinking}
                       className="absolute right-1.5 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition"
                     >
                        <Send className="w-4 h-4" />
                     </button>
                  </div>
               </form>
            </div>
         )}

         {!isCopilotOpen && (
            <button 
              onMouseDown={handleMouseDown}
              onClick={handleCopilotClick}
              className="group relative flex items-center justify-center bg-slate-900 text-white w-12 h-12 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 border border-slate-700 cursor-move"
            >
               {/* Pulse Effect */}
               <div className="absolute inset-0 rounded-full border-2 border-cyan-500 opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
               <Zap className="w-5 h-5 text-cyan-400" />
            </button>
         )}
      </div>

      {/* Dispatch Selection Modal */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" />
                选择派单班组
              </h3>
              <button 
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>请选择需要参与此故障联合排查的专业班组。选中的班组将会收到任务通知。</p>
              </div>
              <div className="space-y-3 mb-6">
                {specialistRoles.map((role) => (
                  <label 
                    key={role}
                    onClick={() => toggleSpecialistSelection(role)}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedSpecialists.includes(role) 
                        ? 'border-blue-500 bg-blue-50/50 text-blue-900 shadow-md' 
                        : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${
                       selectedSpecialists.includes(role) ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'
                    }`}>
                      {selectedSpecialists.includes(role) && <CheckCircleFilled className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex-1 font-bold">{role}</div>
                    <Users className={`w-4 h-4 ${selectedSpecialists.includes(role) ? 'text-blue-500' : 'text-slate-300'}`} />
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  分派意见 / 任务说明 <span className="text-red-500">*</span>
                </label>
                <textarea 
                  value={dispatchInstruction}
                  onChange={(e) => setDispatchInstruction(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm bg-slate-50 min-h-[80px] text-sm"
                  placeholder="请详细说明分派给专业班组的排查重点..."
                />
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsDispatchModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition"
              >
                取消
              </button>
              <button 
                onClick={handleConfirmDispatch}
                disabled={selectedSpecialists.length === 0 || !dispatchInstruction.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200 transition"
              >
                分派任务
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reference Selection Modal */}
      {isRefModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-600" />
                选择 AI 分析参考案例
              </h3>
              <button 
                onClick={() => setIsRefModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 bg-purple-50 text-purple-900 text-sm border-b border-purple-100 flex items-start gap-2">
               <BrainCircuit className="w-4 h-4 mt-0.5 flex-shrink-0" />
               <p>请选择 1-3 个与当前故障最相似的历史工单或知识库案例。AI 将基于这些案例为您提供更精准的分析建议。</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {[
                 ...tickets.filter(t => t.status === TicketStatus.RESOLVED).map(t => ({ 
                    id: t.id, 
                    title: t.title, 
                    desc: t.description, 
                    type: '历史工单', 
                    date: t.createdAt 
                 })),
                 ...knowledgeCases.map(c => ({ 
                    id: c.id, 
                    title: c.title, 
                    desc: c.description, 
                    type: '知识库', 
                    date: c.createdAt 
                 }))
              ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item) => {
                 const isSelected = selectedRefIds.includes(item.id);
                 return (
                    <div 
                      key={item.id}
                      onClick={() => toggleRefSelection(item.id)}
                      className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' 
                          : 'border-slate-200 hover:border-purple-200'
                      }`}
                    >
                       <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                             <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-300 bg-white'
                             }`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                             </div>
                             <span className="font-bold text-slate-800">{item.title}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                             item.type === '知识库' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                             {item.type}
                          </span>
                       </div>
                       <p className="text-sm text-slate-500 pl-7 line-clamp-2">{item.desc}</p>
                    </div>
                 );
              })}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
               <span className="text-sm text-slate-500">
                  已选择: <span className="font-bold text-purple-700">{selectedRefIds.length}</span> / 3
               </span>
               <div className="flex gap-2">
                  <button 
                    onClick={() => setIsRefModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => setIsRefModalOpen(false)}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 shadow-md shadow-purple-200 transition"
                  >
                    确认选择
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-6 h-6 text-brand-600" />
                新建工单
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1 hover:bg-slate-100">✕</button>
            </div>
            
            <form onSubmit={handleCreateTicket} className="p-8 space-y-6">
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700">详细描述 / 故障现象</label>
                  <button 
                    type="button" 
                    onClick={handleAISuggestion}
                    disabled={isSuggesting || !createFormDescription.trim()}
                    className="text-xs bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {isSuggesting ? 'AI 识别中...' : 'AI 智能填单'}
                  </button>
                </div>
                <textarea 
                  name="description" 
                  value={createFormDescription}
                  onChange={(e) => setCreateFormDescription(e.target.value)}
                  required 
                  rows={4} 
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition shadow-sm" 
                  placeholder="请输入客户口述的故障现象，例如：'高新区A栋5G信号很差，经常断线'..." 
                />
              </div>

              {aiSuggestionTip && (
                <div className="bg-violet-50 text-violet-700 text-xs px-4 py-3 rounded-lg flex items-start gap-2 border border-violet-100 animate-in fade-in slide-in-from-top-2">
                   <Bot className="w-4 h-4 flex-shrink-0 mt-0.5" />
                   {aiSuggestionTip}
                </div>
              )}

              {clusterResult && clusterResult.detected && (
                <div className="bg-amber-50 text-amber-800 text-xs px-4 py-3 rounded-lg flex items-start gap-2 border border-amber-200 animate-in fade-in slide-in-from-top-2 shadow-sm">
                   <div className="bg-amber-100 p-1 rounded-full flex-shrink-0">
                      <Siren className="w-4 h-4 text-amber-600" />
                   </div>
                   <div>
                      <p className="font-bold mb-1">⚠️ 疑似区域性故障聚类</p>
                      <p>{clusterResult.reason}</p>
                      <p className="mt-1 font-medium text-amber-900 opacity-80">
                         相关活跃工单数: {clusterResult.count} 
                         <span className="ml-2 bg-amber-200 px-1.5 py-0.5 rounded text-[10px] uppercase">建议合并</span>
                      </p>
                   </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">工单标题</label>
                <input 
                  name="title" 
                  value={createFormTitle}
                  onChange={(e) => setCreateFormTitle(e.target.value)}
                  required 
                  type="text" 
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition shadow-sm bg-slate-50" 
                  placeholder="AI 识别后自动填充..." 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">紧急程度</label>
                <div className="relative">
                  <select 
                    name="urgency" 
                    value={createFormUrgency}
                    onChange={(e) => setCreateFormUrgency(e.target.value as Urgency)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none appearance-none bg-white transition shadow-sm"
                  >
                    <option value={Urgency.LOW}>低</option>
                    <option value={Urgency.MEDIUM}>中</option>
                    <option value={Urgency.HIGH}>高</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition">取消</button>
                <button type="submit" className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-200 transition transform hover:-translate-y-0.5">立即创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
