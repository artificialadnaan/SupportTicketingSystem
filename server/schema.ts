import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

export const ticketTypeEnum = pgEnum("ticket_type", ["bug", "feature_request"]);
export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "in_review",
  "in_progress",
  "resolved",
  "closed",
]);
export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);
export const systemAffectedEnum = pgEnum("system_affected", [
  "procore",
  "hubspot",
  "synchub",
  "other",
]);
export const authorRoleEnum = pgEnum("author_role", ["submitter", "admin"]);

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticket_number", { length: 20 }).notNull().unique(),
  type: ticketTypeEnum("type").notNull(),
  status: ticketStatusEnum("status").notNull().default("open"),
  priority: ticketPriorityEnum("priority").notNull().default("medium"),

  // Submitter
  submitterName: varchar("submitter_name", { length: 255 }).notNull(),
  submitterEmail: varchar("submitter_email", { length: 255 }).notNull(),

  // Common
  title: varchar("title", { length: 500 }).notNull(),
  systemAffected: systemAffectedEnum("system_affected"),

  // Bug-specific
  occurredAt: timestamp("occurred_at", { withTimezone: true }),
  whatWereYouDoing: text("what_were_you_doing"),
  description: text("description").notNull(),
  stepsToReproduce: text("steps_to_reproduce"),
  expectedBehavior: text("expected_behavior"),
  actualBehavior: text("actual_behavior"),
  browserInfo: text("browser_info"),

  // Feature request
  workflowArea: varchar("workflow_area", { length: 255 }),
  currentProcess: text("current_process"),
  desiredOutcome: text("desired_outcome"),
  businessImpact: text("business_impact"),

  // Resolution
  resolutionNotes: text("resolution_notes"),
  resolvedBy: varchar("resolved_by", { length: 255 }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ticketAttachments = pgTable("ticket_attachments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 500 }).notNull(),
  originalName: varchar("original_name", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ticketComments = pgTable("ticket_comments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  authorRole: authorRoleEnum("author_role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ticketStatusHistory = pgTable("ticket_status_history", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  fromStatus: ticketStatusEnum("from_status"),
  toStatus: ticketStatusEnum("to_status").notNull(),
  changedBy: varchar("changed_by", { length: 255 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
