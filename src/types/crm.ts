/**
 * Data models and schemas for the KaKo CRM and AI Routing Engine.
 */

export type Department = 'Sales' | 'Support' | 'Finance';

export type TicketStatus = 'Open' | 'In_Progress' | 'Resolved' | 'Closed';

export type ChannelType = 'WhatsApp' | 'Email' | 'SMS';

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsappId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>; // For external ERP/Billing sync details
}

export interface TicketTimelineEvent {
  id: string;
  timestamp: Date;
  actor: 'System' | 'Agent' | 'Customer';
  actorId?: string; // ID of the agent or customer
  event: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: 'Customer' | 'Agent' | 'AI';
  body: string;
  createdAt: Date;
  mediaUrl?: string; // Optional image attachment support in chat thread
  feedback?: {
    rating: 'positive' | 'negative';
    correction?: string;
  };
}

export interface Ticket {
  id: string;
  customerId: string;
  channel: ChannelType;
  channelMessageId: string; // ID from external channel (e.g. WhatsApp msg ID)
  departmentQueue: Department;
  status: TicketStatus;
  
  // AI Classification & Analysis
  intentClassification: string;
  confidenceScore: number; // 0.0 to 1.0
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  suggestedResponse?: string;
  
  // Content
  subject?: string;
  body: string;
  mediaUrls: string[]; // WhatsApp images, Email attachments/PDFs
  chatHistory: ChatMessage[]; // Chat history for live interaction thread
  
  // SLA & Performance Trackers
  createdAt: Date;
  updatedAt: Date;
  ingestionDurationMs: number; // Duration from webhook ingest to AI classification (<2s target)
  slaLimitHours: number; // e.g., 2 hours for Finance, 4 for Support, 24 for Sales
  slaBreachTime: Date; // Calculated at creation: createdAt + slaLimitHours
  isSlaBreached: boolean;
  resolvedAt?: Date;
  
  // Agent Assignment
  assignedAgentId?: string;
}

export interface CommunicationChannel {
  id: string;
  type: ChannelType;
  displayName: string;
  isActive: boolean;
  config: {
    webhookUrl: string;
    authSecret: string;
    endpoint?: string;
  };
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: Department;
  tags: string[];
}

export type UserRole = 'Agent' | 'Manager' | 'Admin';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  departments: Department[]; // Departments they have access to
  avatar?: string;
}
