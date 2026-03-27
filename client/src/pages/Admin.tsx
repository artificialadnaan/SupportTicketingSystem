import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield, Lock, Search, Bug, Lightbulb, AlertTriangle, Clock, Loader2,
  MessageSquare, Paperclip, ArrowLeft, RefreshCw,
} from "lucide-react";
import { apiRequest, formatDate } from "@/lib/utils";
import type { Ticket, TicketAttachment, TicketComment, TicketStatusHistory } from "@shared/types";
import {
  STATUS_LABELS, PRIORITY_LABELS, SYSTEM_LABELS, TICKET_STATUSES,
  TICKET_TYPES, TICKET_PRIORITIES, SYSTEMS_AFFECTED,
} from "@shared/types";
import type { TicketStatus, TicketPriority, SystemAffected, TicketType } from "@shared/types";

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

type FullTicket = Ticket & {
  attachments?: TicketAttachment[];
  comments?: TicketComment[];
  statusHistory?: TicketStatusHistory[];
};

export default function Admin() {
  const [password, setPassword] = useState(() => sessionStorage.getItem("admin_pw") || "");
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Record<string, string | number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<FullTicket | null>(null);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterSystem, setFilterSystem] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Status update
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  // Comment
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);

  async function authenticate() {
    setAuthLoading(true);
    setAuthError("");
    try {
      await apiRequest("/api/admin/verify", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      sessionStorage.setItem("admin_pw", password);
      setAuthenticated(true);
    } catch {
      setAuthError("Invalid password");
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadTickets() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("type", filterType);
      if (filterStatus) params.set("status", filterStatus);
      if (filterPriority) params.set("priority", filterPriority);
      if (filterSystem) params.set("system", filterSystem);
      if (searchQuery) params.set("search", searchQuery);

      const [ticketData, statsData] = await Promise.all([
        apiRequest(`/api/admin/tickets?${params}`, { adminPassword: password }),
        apiRequest("/api/admin/stats", { adminPassword: password }),
      ]);
      setTickets(ticketData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTicketDetail(id: number) {
    try {
      const detail = await apiRequest(`/api/admin/tickets/${id}`, { adminPassword: password });
      setSelectedTicket(detail);
      setNewStatus(detail.status);
      setStatusNotes("");
      setCommentText("");
    } catch (err) {
      console.error("Failed to load ticket:", err);
    }
  }

  async function updateStatus() {
    if (!selectedTicket || !newStatus) return;
    setUpdating(true);
    try {
      await apiRequest(`/api/admin/tickets/${selectedTicket.id}/status`, {
        method: "PATCH",
        adminPassword: password,
        body: JSON.stringify({ status: newStatus, notes: statusNotes || undefined }),
      });
      await loadTicketDetail(selectedTicket.id);
      loadTickets();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  }

  async function addComment() {
    if (!selectedTicket || !commentText.trim()) return;
    setCommenting(true);
    try {
      await apiRequest(`/api/admin/tickets/${selectedTicket.id}/comments`, {
        method: "POST",
        adminPassword: password,
        body: JSON.stringify({ content: commentText }),
      });
      setCommentText("");
      await loadTicketDetail(selectedTicket.id);
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setCommenting(false);
    }
  }

  useEffect(() => {
    if (authenticated) loadTickets();
  }, [authenticated, filterType, filterStatus, filterPriority, filterSystem]);

  // Login screen
  if (!authenticated) {
    return (
      <div className="max-w-sm mx-auto mt-16">
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-[#1e3a5f] rounded-full flex items-center justify-center mx-auto mb-2">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <CardTitle>Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && authenticate()}
                placeholder="Enter admin password"
              />
            </div>
            {authError && <p className="text-red-600 text-sm">{authError}</p>}
            <Button onClick={authenticate} disabled={authLoading} className="w-full">
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ticket detail view
  if (selectedTicket) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-sm text-muted-foreground">{selectedTicket.ticketNumber}</span>
              <Badge variant={statusVariant[selectedTicket.status]}>{STATUS_LABELS[selectedTicket.status as TicketStatus]}</Badge>
              <Badge variant={priorityVariant[selectedTicket.priority]}>{PRIORITY_LABELS[selectedTicket.priority as TicketPriority]}</Badge>
              {selectedTicket.systemAffected && (
                <Badge variant="outline">{SYSTEM_LABELS[selectedTicket.systemAffected as keyof typeof SYSTEM_LABELS]}</Badge>
              )}
              <Badge variant="outline">{selectedTicket.type === "bug" ? "Bug" : "Feature"}</Badge>
            </div>
            <CardTitle>{selectedTicket.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              By {selectedTicket.submitterName} ({selectedTicket.submitterEmail}) — {formatDate(selectedTicket.createdAt)}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium text-sm mb-1">Description</h4>
              <p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">{selectedTicket.description}</p>
            </div>

            {selectedTicket.type === "bug" && (
              <>
                {selectedTicket.occurredAt && (
                  <div><h4 className="font-medium text-sm mb-1">When It Happened</h4><p className="text-sm">{formatDate(selectedTicket.occurredAt)}</p></div>
                )}
                {selectedTicket.whatWereYouDoing && (
                  <div><h4 className="font-medium text-sm mb-1">What They Were Doing</h4><p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">{selectedTicket.whatWereYouDoing}</p></div>
                )}
                {selectedTicket.expectedBehavior && (
                  <div><h4 className="font-medium text-sm mb-1">Expected Behavior</h4><p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">{selectedTicket.expectedBehavior}</p></div>
                )}
                {selectedTicket.actualBehavior && (
                  <div><h4 className="font-medium text-sm mb-1">Actual Behavior</h4><p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">{selectedTicket.actualBehavior}</p></div>
                )}
                {selectedTicket.stepsToReproduce && (
                  <div><h4 className="font-medium text-sm mb-1">Steps to Reproduce</h4><p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">{selectedTicket.stepsToReproduce}</p></div>
                )}
                {selectedTicket.browserInfo && (
                  <div><h4 className="font-medium text-sm mb-1">Browser Info</h4><p className="text-xs font-mono bg-gray-50 rounded-md p-2 break-all">{selectedTicket.browserInfo}</p></div>
                )}
              </>
            )}

            {selectedTicket.type === "feature_request" && (
              <>
                {selectedTicket.workflowArea && (
                  <div><h4 className="font-medium text-sm mb-1">Workflow Area</h4><p className="text-sm">{selectedTicket.workflowArea}</p></div>
                )}
                {selectedTicket.currentProcess && (
                  <div><h4 className="font-medium text-sm mb-1">Current Process</h4><p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">{selectedTicket.currentProcess}</p></div>
                )}
                {selectedTicket.desiredOutcome && (
                  <div><h4 className="font-medium text-sm mb-1">Desired Outcome</h4><p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">{selectedTicket.desiredOutcome}</p></div>
                )}
                {selectedTicket.businessImpact && (
                  <div><h4 className="font-medium text-sm mb-1">Business Impact</h4><p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">{selectedTicket.businessImpact}</p></div>
                )}
              </>
            )}

            {/* Attachments */}
            {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-1"><Paperclip className="w-4 h-4" /> Attachments</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedTicket.attachments.map((att) => (
                    <a key={att.id} href={`/uploads/${att.filename}`} target="_blank" rel="noopener noreferrer"
                      className="block bg-gray-50 rounded-md p-2 text-center hover:bg-gray-100 transition-colors">
                      {att.mimeType.startsWith("image/") ? (
                        <img src={`/uploads/${att.filename}`} alt={att.originalName} className="w-full h-20 object-cover rounded mb-1" />
                      ) : (
                        <div className="w-full h-20 bg-gray-200 rounded flex items-center justify-center text-xs mb-1">FILE</div>
                      )}
                      <span className="text-xs truncate block">{att.originalName}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Actions */}
            <div className="border-t pt-6 space-y-4">
              <h4 className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4" /> Admin Actions</h4>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Update Status</Label>
                  <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    {TICKET_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes (required for Resolved)</Label>
                  <Textarea
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    rows={2}
                    placeholder={newStatus === "resolved" ? "Describe the resolution..." : "Optional notes..."}
                  />
                </div>
              </div>
              <Button onClick={updateStatus} disabled={updating || newStatus === selectedTicket.status}>
                {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update Status
              </Button>
            </div>

            {/* Comments */}
            <div className="border-t pt-6 space-y-4">
              <h4 className="font-semibold flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Comments</h4>

              {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                <div className="space-y-3">
                  {selectedTicket.comments.map((c) => (
                    <div key={c.id} className={`rounded-md p-3 text-sm ${c.authorRole === "admin" ? "bg-blue-50 border-l-4 border-blue-400" : "bg-gray-50"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{c.authorName}</span>
                        {c.authorRole === "admin" && <Badge variant="info" className="text-[10px]">Admin</Badge>}
                        <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add an admin comment..."
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={addComment} disabled={commenting || !commentText.trim()} className="self-end">
                  {commenting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
                </Button>
              </div>
            </div>

            {/* Status History */}
            {selectedTicket.statusHistory && selectedTicket.statusHistory.length > 0 && (
              <div className="border-t pt-6">
                <h4 className="font-semibold flex items-center gap-2 mb-3"><Clock className="w-4 h-4" /> Status History</h4>
                <div className="space-y-2">
                  {selectedTicket.statusHistory.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 text-sm">
                      <span className="text-xs text-muted-foreground w-36 shrink-0 pt-0.5">{formatDate(h.createdAt)}</span>
                      <div>
                        <span>
                          {h.fromStatus
                            ? <>{STATUS_LABELS[h.fromStatus as TicketStatus]} → {STATUS_LABELS[h.toStatus as TicketStatus]}</>
                            : <>Created as {STATUS_LABELS[h.toStatus as TicketStatus]}</>
                          }
                        </span>
                        <span className="text-muted-foreground"> by {h.changedBy}</span>
                        {h.notes && <p className="text-muted-foreground mt-0.5">{h.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" /> Admin Dashboard
        </h1>
        <Button variant="outline" size="sm" onClick={loadTickets} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "bg-gray-100" },
            { label: "Open", value: stats.open_count, color: "bg-blue-50 text-blue-700" },
            { label: "In Review", value: stats.in_review_count, color: "bg-amber-50 text-amber-700" },
            { label: "In Progress", value: stats.in_progress_count, color: "bg-indigo-50 text-indigo-700" },
            { label: "Critical Open", value: stats.critical_open, color: "bg-red-50 text-red-700" },
          ].map((s) => (
            <Card key={s.label} className={s.color}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{String(s.value)}</p>
                <p className="text-xs font-medium mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-36">
                <option value="">All</option>
                {TICKET_TYPES.map((t) => (
                  <option key={t} value={t}>{t === "bug" ? "Bug" : "Feature"}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-36">
                <option value="">All</option>
                {TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Priority</Label>
              <Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="w-36">
                <option value="">All</option>
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">System</Label>
              <Select value={filterSystem} onChange={(e) => setFilterSystem(e.target.value)} className="w-36">
                <option value="">All</option>
                {SYSTEMS_AFFECTED.map((s) => (
                  <option key={s} value={s}>{SYSTEM_LABELS[s]}</option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label className="text-xs">Search</Label>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tickets..."
                  onKeyDown={(e) => e.key === "Enter" && loadTickets()}
                />
                <Button size="sm" onClick={loadTickets}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticket List */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No tickets found.</div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => loadTicketDetail(t.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {t.type === "bug" ? (
                        <Bug className="w-4 h-4 text-red-500 shrink-0" />
                      ) : (
                        <Lightbulb className="w-4 h-4 text-blue-500 shrink-0" />
                      )}
                      <span className="font-mono text-xs text-muted-foreground">{t.ticketNumber}</span>
                      <Badge variant={statusVariant[t.status]} className="text-[10px]">
                        {STATUS_LABELS[t.status as TicketStatus]}
                      </Badge>
                      <Badge variant={priorityVariant[t.priority]} className="text-[10px]">
                        {PRIORITY_LABELS[t.priority as TicketPriority]}
                      </Badge>
                      {t.systemAffected && (
                        <Badge variant="outline" className="text-[10px]">
                          {SYSTEM_LABELS[t.systemAffected as keyof typeof SYSTEM_LABELS]}
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.submitterName} — {formatDate(t.createdAt)}
                    </p>
                  </div>
                  {t.priority === "critical" && t.status !== "resolved" && t.status !== "closed" && (
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
