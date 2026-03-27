import nodemailer from "nodemailer";
import type { TicketStatus } from "../shared/types.js";

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_review: "In Review",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

function createTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log("[Email] SMTP not configured — skipping email send");
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function baseTemplate(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:#1e3a5f;padding:24px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;">T Rock Support Hub</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 16px;color:#1e3a5f;font-size:18px;">${title}</h2>
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background:#f4f4f5;padding:16px 32px;text-align:center;">
            <p style="margin:0;color:#71717a;font-size:12px;">
              T Rock Construction &middot; Powered by BlueprintOps
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendTicketConfirmation(
  to: string,
  submitterName: string,
  ticketNumber: string,
  title: string,
  type: string
) {
  const transport = createTransport();
  if (!transport) return;

  const typeLabel = type === "bug" ? "Bug Report" : "Feature Request";
  const trackUrl = `${process.env.APP_URL || "http://localhost:5173"}/track?ticket=${ticketNumber}`;

  const body = `
    <p style="color:#3f3f46;line-height:1.6;">Hi ${submitterName},</p>
    <p style="color:#3f3f46;line-height:1.6;">
      Your ${typeLabel.toLowerCase()} has been submitted successfully. Here are the details:
    </p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr>
        <td style="padding:8px 12px;background:#f4f4f5;font-weight:bold;color:#3f3f46;width:140px;">Ticket Number</td>
        <td style="padding:8px 12px;background:#f4f4f5;color:#3f3f46;">${ticketNumber}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:bold;color:#3f3f46;">Type</td>
        <td style="padding:8px 12px;color:#3f3f46;">${typeLabel}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#f4f4f5;font-weight:bold;color:#3f3f46;">Title</td>
        <td style="padding:8px 12px;background:#f4f4f5;color:#3f3f46;">${title}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:bold;color:#3f3f46;">Status</td>
        <td style="padding:8px 12px;color:#3f3f46;">
          <span style="display:inline-block;padding:2px 8px;background:#dbeafe;color:#1e40af;border-radius:9999px;font-size:13px;">Open</span>
        </td>
      </tr>
    </table>
    <p style="color:#3f3f46;line-height:1.6;">
      You can track the status of your ticket at any time:
    </p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${trackUrl}" style="display:inline-block;padding:12px 32px;background:#1e3a5f;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">
        Track Your Ticket
      </a>
    </p>
    <p style="color:#71717a;font-size:13px;line-height:1.6;">
      We'll notify you when there are updates to your ticket.
    </p>
  `;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || "T Rock Support <support@blueprintops.dev>",
      to,
      subject: `[${ticketNumber}] ${typeLabel} Received — ${title}`,
      html: baseTemplate("Ticket Submitted", body),
    });
    console.log(`[Email] Confirmation sent to ${to} for ${ticketNumber}`);
  } catch (err) {
    console.error(`[Email] Failed to send confirmation:`, err);
  }
}

export async function sendStatusUpdate(
  to: string,
  submitterName: string,
  ticketNumber: string,
  title: string,
  newStatus: TicketStatus,
  notes?: string
) {
  const transport = createTransport();
  if (!transport) return;

  const statusLabel = STATUS_LABELS[newStatus];
  const trackUrl = `${process.env.APP_URL || "http://localhost:5173"}/track?ticket=${ticketNumber}`;

  const statusColor: Record<string, string> = {
    in_review: "background:#fef3c7;color:#92400e;",
    in_progress: "background:#dbeafe;color:#1e40af;",
    resolved: "background:#d1fae5;color:#065f46;",
    closed: "background:#e5e7eb;color:#374151;",
  };

  let notesBlock = "";
  if (notes) {
    notesBlock = `
      <div style="margin:16px 0;padding:16px;background:#f4f4f5;border-radius:6px;border-left:4px solid #1e3a5f;">
        <p style="margin:0 0 4px;font-weight:bold;color:#3f3f46;font-size:13px;">
          ${newStatus === "resolved" ? "Resolution Notes" : "Notes"}
        </p>
        <p style="margin:0;color:#3f3f46;line-height:1.6;">${notes}</p>
      </div>
    `;
  }

  const body = `
    <p style="color:#3f3f46;line-height:1.6;">Hi ${submitterName},</p>
    <p style="color:#3f3f46;line-height:1.6;">
      Your ticket <strong>${ticketNumber}</strong> has been updated.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr>
        <td style="padding:8px 12px;background:#f4f4f5;font-weight:bold;color:#3f3f46;width:140px;">Ticket</td>
        <td style="padding:8px 12px;background:#f4f4f5;color:#3f3f46;">${ticketNumber} — ${title}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:bold;color:#3f3f46;">New Status</td>
        <td style="padding:8px 12px;color:#3f3f46;">
          <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:13px;${statusColor[newStatus] || ""}">${statusLabel}</span>
        </td>
      </tr>
    </table>
    ${notesBlock}
    <p style="text-align:center;margin:24px 0;">
      <a href="${trackUrl}" style="display:inline-block;padding:12px 32px;background:#1e3a5f;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">
        View Ticket
      </a>
    </p>
  `;

  const subjectPrefix = newStatus === "resolved" ? "Resolved" : `Status: ${statusLabel}`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || "T Rock Support <support@blueprintops.dev>",
      to,
      subject: `[${ticketNumber}] ${subjectPrefix} — ${title}`,
      html: baseTemplate("Ticket Updated", body),
    });
    console.log(`[Email] Status update sent to ${to} for ${ticketNumber} → ${newStatus}`);
  } catch (err) {
    console.error(`[Email] Failed to send status update:`, err);
  }
}
