
import React, { useState } from 'react';
import { User, Role, Ticket, TicketStatus, Urgency, WorkflowStage, KnowledgeCase } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TicketSystem } from './components/TicketSystem';
import { KnowledgeBase } from './components/KnowledgeBase';
import { Login } from './components/Login';
import { SccAssistant } from './components/SccAssistant';
import { NetworkMonitor } from './components/NetworkMonitor';
import { UserProfile } from './components/UserProfile';

// --- MOCK DATA ---
export const USERS: User[] = [
  { username: 'admin', name: '理想IT人员', role: Role.FRONT_DESK },
  { username: 'cr', name: '客响班人员', role: Role.CUSTOMER_RESPONSE },
  { username: 'core', name: '核心网专家', role: Role.CORE_NET },
  { username: 'opt', name: '网优专家', role: Role.NET_OPT },
  { username: 'trans', name: '传输专家', role: Role.TRANS },
  { username: 'corp', name: '集客专家', role: Role.CORP },
];

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TKT-2001',
    title: '理想L9车型OTA升级下载卡顿',
    description: '华东区域多位车主反馈，在执行OS 5.0版本OTA更新时，下载进度长时间停滞在30%，疑似该区域CDN加速节点或专线带宽受限。',
    urgency: Urgency.HIGH,
    status: TicketStatus.RESOLVED,
    stage: WorkflowStage.ARCHIVED,
    creator: '理想IT人员',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    resolvedAt: new Date(Date.now() - 86400000 * 1.3).toISOString(),
    assignedTo: [],
    diagnoses: [
      { specialistRole: Role.CORE_NET, specialistName: '核心网专家', content: '核心网侧车联网专有APN流量监测正常，未发现信令拥塞。', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString() },
      { specialistRole: Role.TRANS, specialistName: '传输专家', content: '发现上海至常州制造基地的中继链路在高峰期利用率达95%，已紧急扩容。', timestamp: new Date(Date.now() - 86400000 * 1.4).toISOString() }
    ],
    aiAnalysis: '## 故障根本原因分析\n主要问题确认为区域传输链路带宽饱和，导致大文件（OTA安装包）分发时出现TCP重传和拥塞。同时，常州基地的CDN节点缓存策略存在响应延迟。\n\n## 解决方案\n1. 传输班组已完成核心链路扩容。\n2. CDN服务商已刷新缓存节点并增加并发连接数。\n\n## 建议\n后续大版本OTA推送建议采用分批次下发策略，降低单时段链路峰值负载。'
  },
  {
    id: 'TKT-2024',
    title: '地下车库理想APP远程控制失败',
    description: '北京朝阳区某高档写字楼B3层车位，车主反馈APP远程开启空调指令响应时间超过60秒，或直接提示“网络连接超时”。',
    urgency: Urgency.MEDIUM,
    status: TicketStatus.IN_PROGRESS,
    stage: WorkflowStage.DIAGNOSED,
    creator: '理想IT人员',
    createdAt: new Date().toISOString(),
    assignedTo: [Role.CUSTOMER_RESPONSE],
    diagnoses: [
        { specialistRole: Role.NET_OPT, specialistName: '网优专家', content: '现场扫频显示，该车库B3层RSRP值在-115dBm以下，属于深度覆盖盲区，且存在伪基站干扰。', timestamp: new Date().toISOString() }
    ],
  },
  {
    id: 'TKT-2035',
    title: '智能驾驶辅助系统（AD Max）感知数据上报丢包',
    description: '自动驾驶研发部门报告，部分测试车在高速行驶过程中，传感器脱敏数据实时上报率下降，导致云端仿真模拟出现断点。',
    urgency: Urgency.MEDIUM,
    status: TicketStatus.IN_PROGRESS,
    stage: WorkflowStage.FEEDBACK_PROVIDED,
    creator: '理想IT人员',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    assignedTo: [Role.FRONT_DESK],
    diagnoses: [
        { specialistRole: Role.CORP, specialistName: '集客专家', content: '检测到专线VPDN隧道在跨域切换时，GRE封装数据包出现偶发性分片丢弃。', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() }
    ],
    aiAnalysis: '## 故障分析\n由于车载T-Box在高速移动中频繁进行基站切换（Handover），VPN隧道的MTU值设置过大导致跨厂家网元时被强制分片，引起丢包。\n\n## 建议\n建议网优专家协调核心网侧，针对车联网专有APN，下调隧道MTU值为1350，并开启MSS自动调整功能。'
  }
];

const INITIAL_KNOWLEDGE_CASES: KnowledgeCase[] = [
  {
    id: 'KB-2001',
    title: '理想汽车T-Box激活失败常见排查指南',
    description: '新车交付时，中控屏显示“无法连接到云端服务”，导致车辆无法与车主账号绑定。',
    solution: '1. 检查SIM卡状态：确认ICCID是否已在移动网络中激活（Active）；\n2. 信号环境确认：确保车辆不在地下库等盲区；\n3. 信令跟踪：查看S1-MME接口是否有 Attach Request 及相应回复；\n4. 重置T-Box：长按中控上方复位键，重新发起PDP上下文激活。',
    tags: ['T-Box', '激活失败', '信令'],
    uploader: '客响班人员',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: 'KB-2002',
    title: '车载语音助手（理想同学）网络延时优化方案',
    description: '语音交互时常出现“正在加载中”，影响驾驶感官体验。',
    solution: '该问题多由于QoS等级设置较低。应将语音业务APN的QCI等级提升至3（实时视频/话音级），并优化核心网到语音云服务器的路由路径，减少跳转次数。',
    tags: ['QoS', 'QCI', '语音助手', '用户感知'],
    uploader: '网优专家',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
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
      {activeTab === 'monitor' && <NetworkMonitor />}
      {activeTab === 'profile' && <UserProfile />}
      {activeTab === 'tickets' && (
        <TicketSystem 
          user={currentUser} 
          tickets={tickets} 
          knowledgeCases={knowledgeCases}
          onCreateTicket={handleCreateTicket}
          onUpdateTicket={handleUpdateTicket}
        />
      )}
      {activeTab === 'scc' && <SccAssistant />}
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
