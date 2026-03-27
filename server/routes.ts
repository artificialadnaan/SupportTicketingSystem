import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import * as storage from "./storage.js";
import { sendTicketConfirmation, sendStatusUpdate } from "./email.js";
import type { TicketStatus, TicketType, TicketPriority, SystemAffected } from "../shared/types.js";

const upload = multer({
  storage: multer.diskStorage({
    destination: path.resolve(process.cwd(), "uploads"),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "video/mp4",
      "video/quicktime",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

function requireAdmin(req: Request, res: Response, next: () => void) {
  const pw = req.headers["x-admin-password"] as string | undefined;
  if (!pw || pw !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function registerRoutes(app: Router) {
  // === PUBLIC ROUTES ===

  // Submit a ticket (bug or feature request)
  app.post("/api/tickets", upload.array("attachments", 5), async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const ticket = await storage.createTicket({
        type: body.type as TicketType,
        priority: (body.priority as TicketPriority) || "medium",
        submitterName: body.submitterName,
        submitterEmail: body.submitterEmail.toLowerCase(),
        title: body.title,
        description: body.description,
        systemAffected: body.systemAffected as SystemAffected | undefined,
        occurredAt: body.occurredAt || null,
        whatWereYouDoing: body.whatWereYouDoing || null,
        stepsToReproduce: body.stepsToReproduce || null,
        expectedBehavior: body.expectedBehavior || null,
        actualBehavior: body.actualBehavior || null,
        browserInfo: body.browserInfo || null,
        workflowArea: body.workflowArea || null,
        currentProcess: body.currentProcess || null,
        desiredOutcome: body.desiredOutcome || null,
        businessImpact: body.businessImpact || null,
      });

      // Save attachments
      const files = req.files as Express.Multer.File[] | undefined;
      if (files?.length) {
        for (const file of files) {
          await storage.addAttachment({
            ticketId: ticket.id,
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          });
        }
      }

      // Send confirmation email (non-blocking)
      sendTicketConfirmation(
        ticket.submitterEmail,
        ticket.submitterName,
        ticket.ticketNumber,
        ticket.title,
        ticket.type
      ).catch((err) => console.error("[Email] Background send failed:", err));

      const fullTicket = await storage.getTicketById(ticket.id);
      res.status(201).json(fullTicket);
    } catch (err) {
      console.error("[API] Error creating ticket:", err);
      res.status(500).json({ error: "Failed to create ticket" });
    }
  });

  // Look up ticket by number (public)
  app.get("/api/tickets/lookup/:ticketNumber", async (req: Request, res: Response) => {
    try {
      const ticket = await storage.getTicketByNumber(req.params.ticketNumber);
      if (!ticket) {
        res.status(404).json({ error: "Ticket not found" });
        return;
      }
      res.json(ticket);
    } catch (err) {
      console.error("[API] Error looking up ticket:", err);
      res.status(500).json({ error: "Failed to look up ticket" });
    }
  });

  // Get tickets by email (public)
  app.get("/api/tickets/my", async (req: Request, res: Response) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
      }
      const ticketList = await storage.getTicketsByEmail(email);
      res.json(ticketList);
    } catch (err) {
      console.error("[API] Error fetching user tickets:", err);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  // Add comment (public — submitter can comment on their own tickets)
  app.post("/api/tickets/:id/comments", async (req: Request, res: Response) => {
    try {
      const ticketId = Number(req.params.id);
      const { authorName, content } = req.body;
      const comment = await storage.addComment(ticketId, authorName, "submitter", content);
      res.status(201).json(comment);
    } catch (err) {
      console.error("[API] Error adding comment:", err);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // === ADMIN ROUTES ===

  // Verify admin password
  app.post("/api/admin/verify", (req: Request, res: Response) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
      res.json({ valid: true });
    } else {
      res.status(401).json({ valid: false, error: "Invalid password" });
    }
  });

  // Get all tickets (admin)
  app.get("/api/admin/tickets", requireAdmin, async (req: Request, res: Response) => {
    try {
      const filters = {
        type: req.query.type as TicketType | undefined,
        status: req.query.status as TicketStatus | undefined,
        priority: req.query.priority as TicketPriority | undefined,
        system: req.query.system as SystemAffected | undefined,
        search: req.query.search as string | undefined,
      };
      const ticketList = await storage.getAllTickets(filters);
      res.json(ticketList);
    } catch (err) {
      console.error("[API] Error fetching tickets:", err);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  // Get single ticket (admin)
  app.get("/api/admin/tickets/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const ticket = await storage.getTicketById(Number(req.params.id));
      if (!ticket) {
        res.status(404).json({ error: "Ticket not found" });
        return;
      }
      res.json(ticket);
    } catch (err) {
      console.error("[API] Error fetching ticket:", err);
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  });

  // Update ticket status (admin)
  app.patch("/api/admin/tickets/:id/status", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status, notes } = req.body;
      const updated = await storage.updateTicketStatus(
        Number(req.params.id),
        status as TicketStatus,
        "Admin",
        notes
      );
      if (!updated) {
        res.status(404).json({ error: "Ticket not found" });
        return;
      }

      // Send status update email (non-blocking)
      if (status === "in_review" || status === "resolved") {
        sendStatusUpdate(
          updated.submitterEmail,
          updated.submitterName,
          updated.ticketNumber,
          updated.title,
          status as TicketStatus,
          notes
        ).catch((err) => console.error("[Email] Background send failed:", err));
      }

      res.json(updated);
    } catch (err) {
      console.error("[API] Error updating ticket status:", err);
      res.status(500).json({ error: "Failed to update ticket" });
    }
  });

  // Admin comment
  app.post("/api/admin/tickets/:id/comments", requireAdmin, async (req: Request, res: Response) => {
    try {
      const ticketId = Number(req.params.id);
      const { content } = req.body;
      const comment = await storage.addComment(ticketId, "Admin", "admin", content);
      res.status(201).json(comment);
    } catch (err) {
      console.error("[API] Error adding admin comment:", err);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // Dashboard stats (admin)
  app.get("/api/admin/stats", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getTicketStats();
      res.json(stats);
    } catch (err) {
      console.error("[API] Error fetching stats:", err);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
}
