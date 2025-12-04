import { Ticket, TicketStatus, Priority, Role, Notification } from '../types';

// Initial Mock Tickets
export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TKT-20231027-001',
    title: '某区域物联网设备批量掉线',
    content: '接到客户投诉，位于高新园区的智能水表大面积无法上报数据，持续时间约2小时。',
    priority: Priority.HIGH,
    status: TicketStatus.PROCESSING,
    creator: Role.FRONT_SUPPORT,
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
    assignedTeams: [Role.CORE_NET, Role.NET_OPT],
    diagnoses: [
      {
        role: Role.CORE_NET,
        content: '核心网侧HSS数据正常，未发现批量鉴权失败告警。PGW链路负载正常。',
        timestamp: Date.now() - 1000 * 60 * 60 * 2
      }
    ],
    preliminaryJudgment: '怀疑是基站侧或核心网链路问题，请核查。'
  },
  {
    id: 'TKT-20231027-002',
    title: '专线网络延迟高',
    content: 'VIP客户反馈视频监控回传卡顿，延迟超过200ms。',
    priority: Priority.MEDIUM,
    status: TicketStatus.PENDING,
    creator: Role.FRONT_SUPPORT,
    createdAt: Date.now() - 1000 * 60 * 30,
    assignedTeams: [],
    diagnoses: []
  },
  {
    id: 'TKT-20231026-005',
    title: '5G切片配置错误导致无法接入',
    content: '新开通的智慧工厂项目，终端显示注册网络失败。',
    priority: Priority.HIGH,
    status: TicketStatus.RESOLVED,
    creator: Role.FRONT_SUPPORT,
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    assignedTeams: [Role.CORE_NET],
    diagnoses: [
      {
        role: Role.CORE_NET,
        content: '经核查，DNN配置参数有误，已修正切片S-NSSAI参数。',
        timestamp: Date.now() - 1000 * 60 * 60 * 20
      }
    ],
    preliminaryJudgment: '需核对开通参数。',
    aiAnalysis: '根据核心网班组反馈，故障原因为DNN参数配置错误。建议：1. 修正侧参数。2. 将此类问题录入自动核查脚本。',
    resolution: '参数已修改，业务恢复正常。',
    resolvedAt: Date.now() - 1000 * 60 * 60 * 18
  }
];

// Simple "Store" to persist data in memory during session
let ticketsStore = [...INITIAL_TICKETS];
let notificationsStore: Notification[] = [];

// --- Ticket Methods ---

export const getTickets = () => [...ticketsStore];

export const addTicket = (ticket: Ticket) => {
  ticketsStore = [ticket, ...ticketsStore];
};

export const updateTicket = (updatedTicket: Ticket) => {
  ticketsStore = ticketsStore.map(t => t.id === updatedTicket.id ? updatedTicket : t);
};

export const getCaseLibrary = () => {
  return ticketsStore.filter(t => t.status === TicketStatus.RESOLVED).slice(0, 10);
};

// --- Notification Methods ---

export const getNotifications = (role: Role) => {
  return notificationsStore
    .filter(n => n.receiverRole === role)
    .sort((a, b) => b.timestamp - a.timestamp);
};

export const getUnreadCount = (role: Role) => {
  return notificationsStore.filter(n => n.receiverRole === role && !n.isRead).length;
};

export const addNotification = (
  receiverRole: Role, 
  message: string, 
  ticketId: string, 
  ticketTitle: string, 
  type: 'INFO' | 'ALERT' | 'SUCCESS' = 'INFO'
) => {
  const newNotification: Notification = {
    id: `NOTIF-${Date.now()}-${Math.random()}`,
    receiverRole,
    message,
    ticketId,
    ticketTitle,
    timestamp: Date.now(),
    isRead: false,
    type
  };
  notificationsStore = [newNotification, ...notificationsStore];
};

export const markAllAsRead = (role: Role) => {
  notificationsStore = notificationsStore.map(n => 
    n.receiverRole === role ? { ...n, isRead: true } : n
  );
};

// Helper to notify multiple roles
export const notifyRoles = (
  roles: Role[], 
  message: string, 
  ticketId: string, 
  ticketTitle: string, 
  type: 'INFO' | 'ALERT' | 'SUCCESS' = 'INFO'
) => {
  roles.forEach(role => addNotification(role, message, ticketId, ticketTitle, type));
};