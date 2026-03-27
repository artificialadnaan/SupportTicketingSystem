export const TICKET_TYPES = ["bug", "feature_request"] as const;
export type TicketType = (typeof TICKET_TYPES)[number];

export const TICKET_STATUSES = ["open", "in_review", "in_progress", "resolved", "closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const SYSTEMS_AFFECTED = ["procore", "hubspot", "synchub", "other"] as const;
export type SystemAffected = (typeof SYSTEMS_AFFECTED)[number];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_review: "In Review",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const SYSTEM_LABELS: Record<SystemAffected, string> = {
  procore: "Procore",
  hubspot: "HubSpot",
  synchub: "SyncHub",
  other: "Other",
};

export const WORKFLOW_AREAS = [
  "Bid Board / Pre-Construction",
  "Project Portfolio",
  "Budget / Prime Contract",
  "Change Orders",
  "HubSpot CRM Sync",
  "Email Notifications",
  "PDF Reports",
  "CompanyCam Integration",
  "Dashboard / Analytics",
  "User Management",
  "Other",
] as const;

export interface Ticket {
  id: number;
  ticketNumber: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  submitterName: string;
  submitterEmail: string;
  title: string;
  systemAffected: SystemAffected | null;
  occurredAt: string | null;
  whatWereYouDoing: string | null;
  description: string;
  stepsToReproduce: string | null;
  expectedBehavior: string | null;
  actualBehavior: string | null;
  browserInfo: string | null;
  workflowArea: string | null;
  currentProcess: string | null;
  desiredOutcome: string | null;
  businessImpact: string | null;
  resolutionNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: TicketAttachment[];
  comments?: TicketComment[];
  statusHistory?: TicketStatusHistory[];
}

export interface TicketAttachment {
  id: number;
  ticketId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface TicketComment {
  id: number;
  ticketId: number;
  authorName: string;
  authorRole: "submitter" | "admin";
  content: string;
  createdAt: string;
}

export interface TicketStatusHistory {
  id: number;
  ticketId: number;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus;
  changedBy: string;
  notes: string | null;
  createdAt: string;
}
