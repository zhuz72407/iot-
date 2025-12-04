import React, { useState, useEffect } from 'react';
import { Ticket, Role, TicketStatus, Diagnosis, Priority } from '../types';
import { generateTicketAnalysis } from '../services/geminiService';
import { addNotification, notifyRoles } from '../services/mockData';
import { Send, Cpu, CheckSquare, MessageSquare, Archive, Loader2, ArrowRight, UserCheck, Save, Edit3, RotateCcw, ClipboardCheck, Users, FileText, Activity, GitCommit } from 'lucide-react';

interface TicketDetailProps {
  ticket: Ticket;
  currentUserRole: Role;
  onUpdateTicket: (ticket: Ticket) => void;
  onClose: () => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, currentUserRole, onUpdateTicket, onClose }) => {
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [preliminaryInput, setPreliminaryInput] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<Role[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [actionNote, setActionNote] = useState('');
  
  // State for AI Analysis editing
  const [aiAnalysisDraft, setAiAnalysisDraft] = useState('');
  
  // State for managing teams during PROCESSING stage
  const [processingTeams, setProcessingTeams] = useState<Role[]>([]);

  // Sync state with ticket data when ticket loads or changes
  useEffect(() => {
    if (ticket.aiAnalysis) {
      setAiAnalysisDraft(ticket.aiAnalysis);
    } else {
      setAiAnalysisDraft('');
    }

    if (ticket.assignedTeams) {
      setProcessingTeams(ticket.assignedTeams);
    }
  }, [ticket]);

  const availableTeams = [Role.CORE_NET, Role.NET_OPT, Role.TRANS, Role.CORP];

  // --- Handlers ---

  const handleDispatch = () => {
    if (selectedTeams.length === 0) return alert("请选择至少一个专业班组");
    if (!preliminaryInput.trim()) return alert("请输入初步判断");

    const updated: Ticket = {
      ...ticket,
      status: TicketStatus.PROCESSING,
      assignedTeams: selectedTeams,
      preliminaryJudgment: preliminaryInput,
    };
    onUpdateTicket(updated);
    
    // Notify assigned teams
    notifyRoles(
      selectedTeams, 
      `收到新工单分派，请及时处理。初步判断：${preliminaryInput}`, 
      ticket.id, 
      ticket.title
    );
  };

  // Allow CRT to update teams while ticket is processing (e.g. after return)
  const handleUpdateProcessingTeams = () => {
    // Determine new teams to notify
    const newTeams = processingTeams.filter(t => !ticket.assignedTeams.includes(t));
    
    const updated: Ticket = {
      ...ticket,
      assignedTeams: processingTeams
    };
    onUpdateTicket(updated);
    
    if (newTeams.length > 0) {
      notifyRoles(
        newTeams,
        `您所在的班组已被追加协同排查。`,
        ticket.id,
        ticket.title
      );
    }
    alert("协同排查班组已更新，新指派的班组将收到工单。");
  };

  const handleSubmitDiagnosis = () => {
    if (!diagnosisInput.trim()) return;

    const newDiagnosis: Diagnosis = {
      role: currentUserRole,
      content: diagnosisInput,
      timestamp: Date.now()
    };

    const updated: Ticket = {
      ...ticket,
      diagnoses: [...ticket.diagnoses, newDiagnosis]
    };
    onUpdateTicket(updated);
    setDiagnosisInput('');
    
    // Notify CRT
    addNotification(
      Role.CRT,
      `${currentUserRole} 已提交诊断反馈，请查看。`,
      ticket.id,
      ticket.title,
      'SUCCESS'
    );
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    const analysis = await generateTicketAnalysis(ticket);
    
    // Update both ticket and local draft
    setAiAnalysisDraft(analysis);
    const updated: Ticket = {
      ...ticket,
      aiAnalysis: analysis
    };
    onUpdateTicket(updated);
    setIsGeneratingAI(false);
  };

  const handleSaveAnalysisDraft = () => {
    const updated: Ticket = {
      ...ticket,
      aiAnalysis: aiAnalysisDraft
    };
    onUpdateTicket(updated);
  };

  // CRT submits to Front Support
  const handleSubmitToFront = () => {
    if (!aiAnalysisDraft.trim()) return alert("处理意见不能为空");
    
    // Save current draft and move to next status
    const updated: Ticket = {
      ...ticket,
      aiAnalysis: aiAnalysisDraft, 
      status: TicketStatus.PENDING_CLOSURE,
      // We don't clear assignments yet, keeping context
    };
    onUpdateTicket(updated);
    
    // Notify Front Support
    addNotification(
      Role.FRONT_SUPPORT,
      `客响班已提交综合处理意见，请进行归档确认或退回。`,
      ticket.id,
      ticket.title,
      'INFO'
    );
  };

  // Front Support archives the ticket
  const handleResolve = () => {
    if (!actionNote.trim()) return alert("请输入最终处理结果以归档");
    
    const updated: Ticket = {
      ...ticket,
      status: TicketStatus.RESOLVED,
      assignedTeams: [], // Clear active assignments
      resolution: actionNote,
      resolvedAt: Date.now()
    };
    onUpdateTicket(updated);

    // Notify CRT
    addNotification(
      Role.CRT,
      `工单已由前台支撑人员归档。`,
      ticket.id,
      ticket.title,
      'SUCCESS'
    );
  };

  // Front Support returns the ticket
  const handleReturn = () => {
    if (!actionNote.trim()) return alert("请输入退回排查的原因");

    const newDiagnosis: Diagnosis = {
      role: currentUserRole,
      content: `【退回排查】 ${actionNote}`,
      timestamp: Date.now()
    };

    const updated: Ticket = {
      ...ticket,
      status: TicketStatus.PROCESSING, // Go back to processing
      assignedTeams: [], // Reset assigned teams to force CRT to re-evaluate
      diagnoses: [...ticket.diagnoses, newDiagnosis], // Add reason to history
    };
    onUpdateTicket(updated);

    // Notify CRT
    addNotification(
      Role.CRT,
      `工单被前台退回！原因：${actionNote}`,
      ticket.id,
      ticket.title,
      'ALERT'
    );
  };

  // Determine if the current user is CRT and working on the ticket (allows editing)
  const isCrtEditing = currentUserRole === Role.CRT && ticket.status === TicketStatus.PROCESSING;

  // --- Process Flow Chart Component ---
  const ProcessFlowChart = () => {
    // Logic to determine active node
    const isPending = ticket.status === TicketStatus.PENDING;
    const isProcessing = ticket.status === TicketStatus.PROCESSING;
    const isTeamsActive = isProcessing && ticket.assignedTeams.length > 0;
    const isCrtActive = isPending || (isProcessing && ticket.assignedTeams.length === 0);
    const isPendingClosure = ticket.status === TicketStatus.PENDING_CLOSURE;
    const isResolved = ticket.status === TicketStatus.RESOLVED;

    const getNodeStyle = (isActive: boolean, isCompleted: boolean) => {
      if (isActive) return "bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-100 scale-105";
      if (isCompleted) return "bg-green-100 text-green-700 border-green-200";
      return "bg-gray-50 text-gray-400 border-gray-200";
    };

    const getLineStyle = (isPassed: boolean) => {
      return isPassed ? "bg-green-400" : "bg-gray-200";
    };

    return (
      <div className="mb-8 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Activity size={16} /> 工单处理全流程视图
        </h3>
        
        <div className="relative flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0">
          
          {/* Node 1: Front Support (Start) */}
          <div className="relative z-10 flex flex-col items-center group">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${getNodeStyle(false, true)}`}>
               <FileText size={24} />
            </div>
            <span className="mt-2 text-xs font-bold text-gray-700">前台支撑</span>
            <span className="text-[10px] text-gray-400">发起工单</span>
          </div>

          {/* Connector 1-2 */}
          <div className={`hidden md:block h-1 flex-1 mx-2 transition-colors duration-500 ${getLineStyle(!isPending)}`}></div>

          {/* Node 2: CRT (Hub) */}
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${getNodeStyle(isCrtActive, !isCrtActive && !isPending)}`}>
               <Users size={28} />
               {isCrtActive && <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>}
            </div>
            <span className={`mt-2 text-xs font-bold ${isCrtActive ? 'text-indigo-700' : 'text-gray-700'}`}>客响班</span>
            <span className="text-[10px] text-gray-400">研判/分派/综处</span>
          </div>

          {/* Connector 2-3 (Two way) */}
          <div className="hidden md:flex h-1 flex-1 mx-2 items-center justify-center relative">
             <div className={`w-full h-full transition-colors duration-500 ${getLineStyle(isProcessing || isPendingClosure || isResolved)}`}></div>
             {/* If Teams are active, show Activity */}
             {isTeamsActive && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                 <Loader2 size={16} className="text-indigo-500 animate-spin" />
               </div>
             )}
          </div>

          {/* Node 3: Specialized Teams */}
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${getNodeStyle(isTeamsActive, false)}`}>
               <GitCommit size={24} />
            </div>
            <span className={`mt-2 text-xs font-bold ${isTeamsActive ? 'text-indigo-700' : 'text-gray-700'}`}>专业班组</span>
            <span className="text-[10px] text-gray-400">
               {ticket.assignedTeams.length > 0 ? `${ticket.assignedTeams.length} 个班组排查中` : '待分派'}
            </span>
          </div>

        </div>

        {/* Second Row for Return / Closure Flow (Visual layout trick) */}
        <div className="mt-6 relative flex flex-col md:flex-row justify-center items-center gap-6">
            
            {/* Logic Line from CRT down to Confirm */}
            <div className="hidden md:block absolute left-[50%] top-[-24px] w-0.5 h-12 bg-gray-200 -z-0"></div>
            {/* If ready for closure, highlight the path */}
            {(isPendingClosure || isResolved) && (
               <div className="hidden md:block absolute left-[50%] top-[-24px] w-0.5 h-12 bg-green-400 -z-0"></div>
            )}

            {/* Node 4: Front Support (Confirm) */}
            <div className="relative z-10 flex flex-col items-center">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${getNodeStyle(isPendingClosure, isResolved)}`}>
                  <ClipboardCheck size={24} />
               </div>
               <span className={`mt-2 text-xs font-bold ${isPendingClosure ? 'text-indigo-700' : 'text-gray-700'}`}>前台/待归档</span>
               <span className="text-[10px] text-gray-400">确认/退回</span>
            </div>

            {/* Connector 4-5 */}
            <div className={`hidden md:block h-1 w-24 mx-2 transition-colors duration-500 ${getLineStyle(isResolved)}`}></div>

            {/* Node 5: Archived */}
            <div className="relative z-10 flex flex-col items-center">
               <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${getNodeStyle(isResolved, isResolved)}`}>
                  <Archive size={24} />
               </div>
               <span className={`mt-2 text-xs font-bold ${isResolved ? 'text-green-700' : 'text-gray-700'}`}>已归档</span>
               <span className="text-[10px] text-gray-400">流程结束</span>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-indigo-50">
        <div className="flex justify-between items-start">
          <div>
             <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
               {ticket.title}
               <span className="text-sm px-2 py-1 rounded bg-white border border-indigo-200 text-indigo-700 font-normal">
                 {ticket.id}
               </span>
             </h1>
             <p className="mt-2 text-gray-600">{ticket.content}</p>
          </div>
          <div className="text-right">
             <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2
                ${ticket.priority === Priority.HIGH ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
             `}>
               {ticket.priority} 优先级
             </div>
             <div className="text-sm text-gray-500">创建人: {ticket.creator}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Render the new interactive flow chart */}
        <ProcessFlowChart />

        {/* 1. Preliminary Info (Always visible if exists) */}
        {ticket.preliminaryJudgment && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
             <h3 className="font-semibold text-blue-900 mb-2">客响班初步判断</h3>
             <p className="text-blue-800">{ticket.preliminaryJudgment}</p>
          </div>
        )}

        {/* 2. Diagnoses List */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <MessageSquare size={18} /> 诊断与沟通记录
          </h3>
          {ticket.diagnoses.length === 0 ? (
            <p className="text-gray-400 italic text-sm">暂无记录</p>
          ) : (
            ticket.diagnoses.map((diag, idx) => (
              <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs
                    ${diag.role === Role.FRONT_SUPPORT ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}
                `}>
                  {diag.role === Role.FRONT_SUPPORT ? '前' : diag.role.substring(0,2)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{diag.role}</span>
                    <span className="text-xs text-gray-400">{new Date(diag.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{diag.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 3. AI Analysis (Read Only View) */}
        {/* If CRT is editing, we hide this block and show the editor in the action area instead to avoid duplication */}
        {ticket.aiAnalysis && !isCrtEditing && (
           <div className="bg-purple-50 p-5 rounded-lg border border-purple-200 shadow-sm animate-fade-in-up">
             <div className="flex items-center gap-2 mb-3 text-purple-800 font-bold">
               <Cpu size={20} />
               AI 综合智能分析报告 / 客响班处理意见
             </div>
             <div className="prose prose-sm text-purple-900 whitespace-pre-line">
               {ticket.aiAnalysis}
             </div>
           </div>
        )}

        {/* 4. Final Resolution */}
        {ticket.status === TicketStatus.RESOLVED && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
             <h3 className="font-semibold text-green-900 mb-2">最终处理结果 (归档)</h3>
             <p className="text-green-800">{ticket.resolution}</p>
             <div className="mt-2 text-xs text-green-600">归档时间: {new Date(ticket.resolvedAt!).toLocaleString()}</div>
          </div>
        )}


        {/* --- ACTION AREAS --- */}

        {/* Action: CRT Initial Dispatch (Pending -> Processing) */}
        {currentUserRole === Role.CRT && ticket.status === TicketStatus.PENDING && (
          <div className="bg-white border-2 border-dashed border-gray-300 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-4">工单分派与初步研判</h3>
            <textarea
              className="w-full p-3 border rounded-md mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="请输入初步判断意见..."
              rows={3}
              value={preliminaryInput}
              onChange={(e) => setPreliminaryInput(e.target.value)}
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">选择分派班组:</label>
              <div className="flex flex-wrap gap-2">
                {availableTeams.map(team => (
                  <button
                    key={team}
                    onClick={() => setSelectedTeams(prev => prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team])}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors
                      ${selectedTeams.includes(team) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}
                    `}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleDispatch}
              className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex justify-center items-center gap-2"
            >
              <ArrowRight size={18} /> 确认分派
            </button>
          </div>
        )}

        {/* Action: CRT Re-Dispatch / Manage Teams (Processing) */}
        {currentUserRole === Role.CRT && ticket.status === TicketStatus.PROCESSING && (
           <div className="bg-white border border-gray-200 p-5 rounded-lg mb-4 shadow-sm">
             <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Users size={18} /> 协同排查班组管理
             </h3>
             <p className="text-xs text-gray-500 mb-3">若工单被退回或需补充排查，可在此增加或调整分派的班组。</p>
             <div className="flex flex-wrap gap-2 mb-3">
                {availableTeams.map(team => (
                  <button
                    key={team}
                    onClick={() => setProcessingTeams(prev => prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team])}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors
                      ${processingTeams.includes(team) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}
                    `}
                  >
                    {team}
                  </button>
                ))}
             </div>
             <button
               onClick={handleUpdateProcessingTeams}
               className="text-sm px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 transition-colors"
             >
               更新指派班组
             </button>
           </div>
        )}

        {/* Action: Specialized Team Diagnosis (Processing) */}
        {availableTeams.includes(currentUserRole) && 
         ticket.status === TicketStatus.PROCESSING && 
         ticket.assignedTeams.includes(currentUserRole) && (
          <div className="bg-white border-t border-gray-200 pt-6">
             <h3 className="font-semibold text-gray-800 mb-4">
                {ticket.diagnoses.some(d => d.role === currentUserRole) ? '提交补充诊断' : '提交专业诊断'}
             </h3>
             <textarea
              className="w-full p-3 border rounded-md mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="请输入专业诊断结果..."
              rows={4}
              value={diagnosisInput}
              onChange={(e) => setDiagnosisInput(e.target.value)}
            />
            <button
              onClick={handleSubmitDiagnosis}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Send size={16} /> 提交反馈
            </button>
          </div>
        )}

        {/* Action: CRT Analysis & Submit to Front (Processing -> Pending Closure) */}
        {currentUserRole === Role.CRT && ticket.status === TicketStatus.PROCESSING && (
           <div className="space-y-4 border-t border-gray-200 pt-6">
             
             {/* 1. Generate AI Button (Show if not generated yet) */}
             {!ticket.aiAnalysis && ticket.diagnoses.length > 0 && (
               <button
                 onClick={handleGenerateAI}
                 disabled={isGeneratingAI}
                 className="w-full py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex justify-center items-center gap-2 shadow-sm transition-all"
               >
                 {isGeneratingAI ? <Loader2 className="animate-spin" /> : <Cpu />}
                 {isGeneratingAI ? 'AI 正在分析中...' : '生成 AI 综合研判报告'}
               </button>
             )}
             
             {/* 2. Edit & Confirm Analysis (Show if generated) */}
             {ticket.aiAnalysis && (
                <div className="p-5 bg-white border border-indigo-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-3 text-indigo-800 font-bold">
                        <Edit3 size={20} />
                        修改与确认处理意见
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                        AI 已根据各班组回复生成初步意见。请您检查、补充或修改，确认无误后提交给前台。
                    </p>
                    <textarea 
                        className="w-full p-4 border border-indigo-100 bg-indigo-50 rounded-md text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[150px]"
                        value={aiAnalysisDraft}
                        onChange={(e) => setAiAnalysisDraft(e.target.value)}
                        placeholder="在此处编辑处理意见..."
                    />
                    
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleSaveAnalysisDraft}
                            className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex justify-center items-center gap-2"
                        >
                            <Save size={18} /> 保存草稿
                        </button>
                        <button
                            onClick={handleSubmitToFront}
                            className="flex-1 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex justify-center items-center gap-2"
                        >
                            <UserCheck size={18} /> 确认并提交给前台
                        </button>
                    </div>
                </div>
             )}
           </div>
        )}

        {/* Action: Front Support Archive or Return (Pending Closure -> Resolved OR Processing) */}
        {currentUserRole === Role.FRONT_SUPPORT && ticket.status === TicketStatus.PENDING_CLOSURE && (
            <div className="bg-white border-t border-gray-200 pt-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <ClipboardCheck size={18}/> 确认工单处理结果
                    </h4>
                    
                    {/* Context: CRT's Analysis */}
                    <div className="bg-indigo-50 p-4 rounded border border-indigo-100 mb-6 text-sm">
                        <span className="font-bold text-indigo-800 block mb-2">客响班处理意见：</span>
                        <div className="text-gray-700 whitespace-pre-wrap">{ticket.aiAnalysis}</div>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">处理说明 / 退回原因</label>
                    <textarea
                        className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="如果是归档，请输入最终解决情况；如果是退回，请输入需进一步排查的问题点..."
                        rows={3}
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                    />
                    
                    <div className="flex gap-4">
                         <button
                            onClick={handleReturn}
                            className="flex-1 py-2.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-md hover:bg-orange-200 flex justify-center items-center gap-2 transition-colors"
                        >
                            <RotateCcw size={18} /> 退回继续排查
                        </button>
                        <button
                            onClick={handleResolve}
                            className="flex-1 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 flex justify-center items-center gap-2 shadow-sm transition-colors"
                        >
                            <CheckSquare size={18} /> 确认解决并归档
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default TicketDetail;