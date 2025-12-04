export enum Role {
  FRONT_SUPPORT = '前台支撑人员',
  CRT = '客响班',
  CORE_NET = '核心网专业班',
  NET_OPT = '网优专业班',
  TRANS = '传输专业班',
  CORP = '集客专业班'
}

export enum TicketStatus {
  PENDING = '待处理',
  PROCESSING = '处理中',
  PENDING_CLOSURE = '待归档',
  RESOLVED = '已处理'
}

export enum Priority {
  HIGH = '高',
  MEDIUM = '中',
  LOW = '低'
}

export interface Diagnosis {
  role: Role;
  content: string;
  timestamp: number;
}

export interface Ticket {
  id: string;
  title: string;
  content: string;
  priority: Priority;
  status: TicketStatus;
  creator: Role; // Who created it
  createdAt: number;
  assignedTeams: Role[]; // Teams currently tasked with diagnosis
  diagnoses: Diagnosis[]; // Responses from teams
  preliminaryJudgment?: string; // Initial thought by CRT
  aiAnalysis?: string; // The generated AI report
  resolution?: string; // Final resolution note
  resolvedAt?: number;
}

export interface DashboardStats {
  todayCount: number;
  processingCount: number;
  completedCount: number;
  resolutionRate: number;
}

export interface Notification {
  id: string;
  receiverRole: Role;
  message: string;
  ticketId: string;
  ticketTitle: string;
  timestamp: number;
  isRead: boolean;
  type: 'INFO' | 'ALERT' | 'SUCCESS';
}