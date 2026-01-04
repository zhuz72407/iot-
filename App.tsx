
import React, { useState } from 'react';
import { User, Role, Ticket, TicketStatus, Urgency, WorkflowStage, KnowledgeCase } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TicketSystem } from './components/TicketSystem';
import { KnowledgeBase } from './components/KnowledgeBase';
import { Login } from './components/Login';

// --- MOCK DATA ---
export const USERS: User[] = [
  { username: 'admin', name: '前台人员', role: Role.FRONT_DESK },
  { username: 'cr', name: '客响班人员', role: Role.CUSTOMER_RESPONSE },
  { username: 'core', name: '核心网专家', role: Role.CORE_NET },
  { username: 'opt', name: '网优专家', role: Role.NET_OPT },
  { username: 'trans', name: '传输专家', role: Role.TRANS },
  { username: 'corp', name: '集客专家', role: Role.CORP },
];

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TKT-1001',
    title: '7G区域4G网络断连',
    description: '7G工业园区多个物联网传感器报告信号完全丢失。',
    urgency: Urgency.HIGH,
    status: TicketStatus.RESOLVED,
    stage: WorkflowStage.ARCHIVED,
    creator: '前台人员',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    resolvedAt: new Date(Date.now() - 86400000 * 1.3).toISOString(),
    assignedTo: [],
    diagnoses: [
      { specialistRole: Role.CORE_NET, specialistName: '核心网专家', content: '核心网网关状态稳定，无告警。', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString() },
      { specialistRole: Role.TRANS, specialistName: '传输专家', content: '检测到本地交换节点附近光纤中断。', timestamp: new Date(Date.now() - 86400000 * 1.4).toISOString() }
    ],
    aiAnalysis: '## 故障根本原因分析\n主要问题被确认为本地交换节点附近的物理光纤中断，导致7G区域传输中断。\n\n## 解决方案\n传输班组已修复光纤熔接点。业务已成功恢复。\n\n## 建议\n建议对工业园区区域的光纤管道进行预防性维护。'
  },
  {
    id: 'TKT-1024',
    title: '智能电表网关高延迟',
    description: '客户反映在A住宅区轮询智能电表时出现超时错误。',
    urgency: Urgency.MEDIUM,
    status: TicketStatus.IN_PROGRESS,
    stage: WorkflowStage.DIAGNOSED,
    creator: '前台人员',
    createdAt: new Date().toISOString(),
    assignedTo: [Role.CUSTOMER_RESPONSE],
    diagnoses: [
        { specialistRole: Role.NET_OPT, specialistName: '网优专家', content: '检测到频段3存在信号干扰。需要进行优化。', timestamp: new Date().toISOString() }
    ],
  },
  {
    id: 'TKT-1035',
    title: 'VPDN 专线连接不稳定',
    description: '某企业客户反馈VPDN业务在每天下午3点左右出现抖动。',
    urgency: Urgency.MEDIUM,
    status: TicketStatus.IN_PROGRESS,
    stage: WorkflowStage.FEEDBACK_PROVIDED,
    creator: '前台人员',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    assignedTo: [Role.FRONT_DESK], // Waiting for Front Desk to Archive
    diagnoses: [
        { specialistRole: Role.CORP, specialistName: '集客专家', content: '客户侧路由器配置正常，但上行链路带宽在高峰期打满。', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() }
    ],
    aiAnalysis: '## 故障分析\n集客班组检测到带宽在特定时间段饱和。\n\n## 建议\n建议前台支撑人员联系客户升级带宽套餐，或在非高峰期进行大流量数据传输。'
  }
];

const INITIAL_KNOWLEDGE_CASES: KnowledgeCase[] = [
  {
    id: 'KB-001',
    title: 'NB-IoT 水表上报失败排查指南',
    description: '水表在地下室无信号，无法上报读数。',
    solution: '1. 检查基站覆盖；2. 建议加装室分系统或信号增强器。',
    tags: ['NB-IoT', '弱覆盖', '水表'],
    uploader: '客响班人员',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [knowledgeCases, setKnowledgeCases] = useState<KnowledgeCase[]>(INITIAL_KNOWLEDGE_CASES);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Direct specialists to tickets page immediately as they work there primarily
    if (user.role !== Role.FRONT_DESK && user.role !== Role.CUSTOMER_RESPONSE) {
      setActiveTab('tickets');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleCreateTicket = (ticket: Ticket) => {
    setTickets([ticket, ...tickets]);
  };

  const handleUpdateTicket = (updatedTicket: Ticket) => {
    setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
  };

  const handleAddKnowledgeCase = (newCase: KnowledgeCase) => {
    setKnowledgeCases([newCase, ...knowledgeCases]);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      user={currentUser} 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onLogout={handleLogout}
    >
      {activeTab === 'dashboard' && <Dashboard tickets={tickets} />}
      {activeTab === 'tickets' && (
        <TicketSystem 
          user={currentUser} 
          tickets={tickets} 
          knowledgeCases={knowledgeCases}
          onCreateTicket={handleCreateTicket}
          onUpdateTicket={handleUpdateTicket}
        />
      )}
      {activeTab === 'knowledge' && (
        <KnowledgeBase 
          user={currentUser}
          tickets={tickets} 
          manualCases={knowledgeCases}
          onAddCase={handleAddKnowledgeCase}
        />
      )}
    </Layout>
  );
}
