import { db } from "./db.js";
import { tickets, ticketAttachments, ticketComments, ticketStatusHistory } from "./schema.js";
import { eq, desc, sql, and, ilike, or } from "drizzle-orm";
import type { TicketStatus, TicketType, TicketPriority, SystemAffected } from "../shared/types.js";

function generateTicketNumber(): string {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TRK-${yr}${mo}-${rand}`;
}

export async function createTicket(data: {
  type: TicketType;
  priority: TicketPriority;
  submitterName: string;
  submitterEmail: string;
  title: string;
  description: string;
  systemAffected?: SystemAffected | null;
  occurredAt?: string | null;
  whatWereYouDoing?: string | null;
  stepsToReproduce?: string | null;
  expectedBehavior?: string | null;
  actualBehavior?: string | null;
  browserInfo?: string | null;
  workflowArea?: string | null;
  currentProcess?: string | null;
  desiredOutcome?: string | null;
  businessImpact?: string | null;
}) {
  const ticketNumber = generateTicketNumber();

  const [ticket] = await db
    .insert(tickets)
    .values({
      ...data,
      ticketNumber,
      occurredAt: data.occurredAt ? new Date(data.occurredAt) : null,
      systemAffected: data.systemAffected ?? null,
    })
    .returning();

  // Log initial status
  await db.insert(ticketStatusHistory).values({
    ticketId: ticket.id,
    fromStatus: null,
    toStatus: "open",
    changedBy: data.submitterName,
    notes: "Ticket created",
  });

  return ticket;
}

export async function getTicketById(id: number) {
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, id),
  });
  if (!ticket) return null;

  const attachments = await db
    .select()
    .from(ticketAttachments)
    .where(eq(ticketAttachments.ticketId, id))
    .orderBy(desc(ticketAttachments.createdAt));

  const comments = await db
    .select()
    .from(ticketComments)
    .where(eq(ticketComments.ticketId, id))
    .orderBy(desc(ticketComments.createdAt));

  const history = await db
    .select()
    .from(ticketStatusHistory)
    .where(eq(ticketStatusHistory.ticketId, id))
    .orderBy(desc(ticketStatusHistory.createdAt));

  return { ...ticket, attachments, comments, statusHistory: history };
}

export async function getTicketByNumber(ticketNumber: string) {
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.ticketNumber, ticketNumber),
  });
  if (!ticket) return null;
  return getTicketById(ticket.id);
}

export async function getTicketsByEmail(email: string) {
  return db
    .select()
    .from(tickets)
    .where(eq(tickets.submitterEmail, email.toLowerCase()))
    .orderBy(desc(tickets.createdAt));
}

export async function getAllTickets(filters?: {
  type?: TicketType;
  status?: TicketStatus;
  priority?: TicketPriority;
  system?: SystemAffected;
  search?: string;
}) {
  const conditions = [];

  if (filters?.type) {
    conditions.push(eq(tickets.type, filters.type));
  }
  if (filters?.status) {
    conditions.push(eq(tickets.status, filters.status));
  }
  if (filters?.priority) {
    conditions.push(eq(tickets.priority, filters.priority));
  }
  if (filters?.system) {
    conditions.push(eq(tickets.systemAffected, filters.system));
  }
  if (filters?.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(tickets.title, term),
        ilike(tickets.ticketNumber, term),
        ilike(tickets.submitterName, term),
        ilike(tickets.description, term)
      )!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db.select().from(tickets).where(where).orderBy(desc(tickets.createdAt));
}

export async function updateTicketStatus(
  id: number,
  newStatus: TicketStatus,
  changedBy: string,
  notes?: string
) {
  const ticket = await db.query.tickets.findFirst({ where: eq(tickets.id, id) });
  if (!ticket) return null;

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updatedAt: new Date(),
  };

  if (newStatus === "resolved") {
    updateData.resolvedAt = new Date();
    updateData.resolvedBy = changedBy;
    if (notes) updateData.resolutionNotes = notes;
  }

  const [updated] = await db.update(tickets).set(updateData).where(eq(tickets.id, id)).returning();

  await db.insert(ticketStatusHistory).values({
    ticketId: id,
    fromStatus: ticket.status,
    toStatus: newStatus,
    changedBy,
    notes: notes ?? null,
  });

  return updated;
}

export async function addComment(
  ticketId: number,
  authorName: string,
  authorRole: "submitter" | "admin",
  content: string
) {
  const [comment] = await db
    .insert(ticketComments)
    .values({ ticketId, authorName, authorRole, content })
    .returning();

  await db.update(tickets).set({ updatedAt: new Date() }).where(eq(tickets.id, ticketId));

  return comment;
}

export async function addAttachment(data: {
  ticketId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}) {
  const [attachment] = await db.insert(ticketAttachments).values(data).returning();
  return attachment;
}

export async function getTicketStats() {
  const result = await db.execute(sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'open') as open_count,
      COUNT(*) FILTER (WHERE status = 'in_review') as in_review_count,
      COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
      COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
      COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
      COUNT(*) FILTER (WHERE type = 'bug') as bug_count,
      COUNT(*) FILTER (WHERE type = 'feature_request') as feature_count,
      COUNT(*) FILTER (WHERE priority = 'critical' AND status NOT IN ('resolved', 'closed')) as critical_open
    FROM tickets
  `);
  return result.rows[0];
}
