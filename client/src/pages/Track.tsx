import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, CheckCircle2, Clock, MessageSquare, Paperclip, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, formatDate } from "@/lib/utils";
import type { Ticket, TicketStatusHistory, TicketComment, TicketAttachment } from "@shared/types";
import { STATUS_LABELS, PRIORITY_LABELS, SYSTEM_LABELS } from "@shared/types";
import type { TicketStatus, TicketPriority } from "@shared/types";

const statusVariant: Record<string, "default" | "warning" | "info" | "success" | "secondary"> = {
  open: "info",
  in_review: "warning",
  in_progress: "default",
  resolved: "success",
  closed: "secondary",
};

const priorityVariant: Record<string, "default" | "destructive" | "warning" | "secondary"> = {
  low: "secondary",
  medium: "default",
  high: "warning",
  critical: "destructive",
};

export default function Track() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const ticketParam = params.get("ticket");
  const justSubmitted = params.get("submitted") === "true";

  const [mode, setMode] = useState<"search" | "byEmail" | "detail">(ticketParam ? "detail" : "search");
  const [ticketNumber, setTicketNumber] = useState(ticketParam || "");
  const [email, setEmail] = useState("");
  const [ticket, setTicket] = useState<(Ticket & { attachments?: TicketAttachment[]; comments?: TicketComment[]; statusHistory?: TicketStatusHistory[] }) | null>(null);
  const [ticketList, setTicketList] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ticketParam) {
      lookupTicket(ticketParam);
    }
  }, [ticketParam]);

  async function lookupTicket(num: string) {
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest(`/api/tickets/lookup/${encodeURIComponent(num)}`);
      setTicket(result);
      setMode("detail");
    } catch {
      setError("Ticket not found. Check the ticket number and try again.");
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }

  async function lookupByEmail() {
    setLoading(true);
    setError("");
    try {
      const results = await apiRequest(`/api/tickets/my?email=${encodeURIComponent(email)}`);
      setTicketList(results);
      setMode("byEmail");
    } catch {
      setError("Failed to look up tickets.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {justSubmitted && ticket && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-emerald-800">Ticket Submitted Successfully!</p>
            <p className="text-sm text-emerald-700 mt-1">
              Your ticket number is <strong>{ticket.ticketNumber}</strong>. Save this for your records.
              You'll receive a confirmation email shortly.
            </p>
          </div>
        </div>
      )}

      {mode !== "detail" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Track Your Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Lookup by ticket number */}
            <div className="space-y-3">
              <Label>Look Up by Ticket Number</Label>
              <div className="flex gap-2">
                <Input
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="e.g., TRK-2603-A1B2"
                  className="flex-1"
                />
                <Button
                  onClick={() => lookupTicket(ticketNumber)}
                  disabled={!ticketNumber.trim() || loading}
                >
                  Search
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Lookup by email */}
            <div className="space-y-3">
              <Label>Look Up by Email</Label>
              <div className="flex gap-2">
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@trockinc.com"
                  type="email"
                  className="flex-1"
                />
                <Button onClick={lookupByEmail} disabled={!email.trim() || loading}>
                  Search
                </Button>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
          </CardContent>
        </Card>
      )}

      {/* Ticket list from email search */}
      {mode === "byEmail" && ticketList.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Your Tickets ({ticketList.length})</h3>
          {ticketList.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => lookupTicket(t.ticketNumber)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-muted-foreground">{t.ticketNumber}</span>
                    <Badge variant={statusVariant[t.status]}>{STATUS_LABELS[t.status as TicketStatus]}</Badge>
                    <Badge variant={priorityVariant[t.priority]}>{PRIORITY_LABELS[t.priority as TicketPriority]}</Badge>
                  </div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {mode === "byEmail" && ticketList.length === 0 && !loading && !error && (
        <p className="text-center text-muted-foreground py-8">No tickets found for this email.</p>
      )}

      {/* Ticket detail */}
      {mode === "detail" && ticket && (
        <div className="space-y-4">
          {!justSubmitted && (
            <Button variant="ghost" size="sm" onClick={() => { setMode("search"); setTicket(null); }} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Search
            </Button>
          )}

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-sm text-muted-foreground">{ticket.ticketNumber}</span>
                <Badge variant={statusVariant[ticket.status]}>{STATUS_LABELS[ticket.status as TicketStatus]}</Badge>
                <Badge variant={priorityVariant[ticket.priority]}>{PRIORITY_LABELS[ticket.priority as TicketPriority]}</Badge>
                {ticket.systemAffected && (
                  <Badge variant="outline">{SYSTEM_LABELS[ticket.systemAffected as keyof typeof SYSTEM_LABELS]}</Badge>
                )}
                <Badge variant="outline">{ticket.type === "bug" ? "Bug Report" : "Feature Request"}</Badge>
              </div>
              <CardTitle>{ticket.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Submitted by {ticket.submitterName} on {formatDate(ticket.createdAt)}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="font-medium text-sm mb-1">Description</h4>
                <p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">{ticket.description}</p>
              </div>

              {ticket.type === "bug" && (
                <>
                  {ticket.occurredAt && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">When It Happened</h4>
                      <p className="text-sm">{formatDate(ticket.occurredAt)}</p>
                    </div>
                  )}
                  {ticket.whatWereYouDoing && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">What They Were Doing</h4>
                      <p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">{ticket.whatWereYouDoing}</p>
                    </div>
                  )}
                  {ticket.expectedBehavior && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Expected Behavior</h4>
                      <p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">{ticket.expectedBehavior}</p>
                    </div>
                  )}
                  {ticket.actualBehavior && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Actual Behavior</h4>
                      <p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">{ticket.actualBehavior}</p>
                    </div>
                  )}
                  {ticket.stepsToReproduce && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Steps to Reproduce</h4>
                      <p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">{ticket.stepsToReproduce}</p>
                    </div>
                  )}
                </>
              )}

              {ticket.type === "feature_request" && (
                <>
                  {ticket.workflowArea && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Workflow Area</h4>
                      <p className="text-sm">{ticket.workflowArea}</p>
                    </div>
                  )}
                  {ticket.currentProcess && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Current Process</h4>
                      <p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">{ticket.currentProcess}</p>
                    </div>
                  )}
                  {ticket.desiredOutcome && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Desired Outcome</h4>
                      <p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">{ticket.desiredOutcome}</p>
                    </div>
                  )}
                  {ticket.businessImpact && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Business Impact</h4>
                      <p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">{ticket.businessImpact}</p>
                    </div>
                  )}
                </>
              )}

              {/* Resolution */}
              {ticket.resolutionNotes && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4">
                  <h4 className="font-medium text-sm mb-1 text-emerald-800">Resolution</h4>
                  <p className="text-sm text-emerald-700 whitespace-pre-wrap">{ticket.resolutionNotes}</p>
                  {ticket.resolvedAt && (
                    <p className="text-xs text-emerald-600 mt-2">
                      Resolved {formatDate(ticket.resolvedAt)} by {ticket.resolvedBy}
                    </p>
                  )}
                </div>
              )}

              {/* Attachments */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <Paperclip className="w-4 h-4" /> Attachments
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ticket.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={`/uploads/${att.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-gray-50 rounded-md p-2 text-sm hover:bg-gray-100 transition-colors"
                      >
                        {att.mimeType.startsWith("image/") ? (
                          <img
                            src={`/uploads/${att.filename}`}
                            alt={att.originalName}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">
                            FILE
                          </div>
                        )}
                        <span className="truncate text-xs">{att.originalName}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {ticket.comments && ticket.comments.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" /> Comments
                  </h4>
                  <div className="space-y-3">
                    {ticket.comments.map((c) => (
                      <div
                        key={c.id}
                        className={`rounded-md p-3 text-sm ${
                          c.authorRole === "admin" ? "bg-blue-50 border-l-4 border-blue-400" : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{c.authorName}</span>
                          {c.authorRole === "admin" && (
                            <Badge variant="info" className="text-[10px]">Admin</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{c.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status History */}
              {ticket.statusHistory && ticket.statusHistory.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Status History
                  </h4>
                  <div className="space-y-2">
                    {ticket.statusHistory.map((h) => (
                      <div key={h.id} className="flex items-center gap-3 text-sm">
                        <span className="text-xs text-muted-foreground w-36 shrink-0">
                          {formatDate(h.createdAt)}
                        </span>
                        <span>
                          {h.fromStatus ? (
                            <>
                              {STATUS_LABELS[h.fromStatus as TicketStatus]} → {STATUS_LABELS[h.toStatus as TicketStatus]}
                            </>
                          ) : (
                            <>Created as {STATUS_LABELS[h.toStatus as TicketStatus]}</>
                          )}
                        </span>
                        {h.notes && <span className="text-muted-foreground">— {h.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
