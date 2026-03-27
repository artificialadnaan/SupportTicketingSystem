import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, X, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { apiRequest, getBrowserInfo } from "@/lib/utils";
import {
  SYSTEMS_AFFECTED,
  SYSTEM_LABELS,
  TICKET_PRIORITIES,
  PRIORITY_LABELS,
} from "@shared/types";

export default function TicketForm() {
  const [, navigate] = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData();

    formData.append("type", "bug");
    formData.append("submitterName", (form.elements.namedItem("submitterName") as HTMLInputElement).value);
    formData.append("submitterEmail", (form.elements.namedItem("submitterEmail") as HTMLInputElement).value);
    formData.append("title", (form.elements.namedItem("title") as HTMLInputElement).value);
    formData.append("systemAffected", (form.elements.namedItem("systemAffected") as HTMLSelectElement).value);
    formData.append("priority", (form.elements.namedItem("priority") as HTMLSelectElement).value);
    formData.append("occurredAt", (form.elements.namedItem("occurredAt") as HTMLInputElement).value);
    formData.append("whatWereYouDoing", (form.elements.namedItem("whatWereYouDoing") as HTMLTextAreaElement).value);
    formData.append("description", (form.elements.namedItem("description") as HTMLTextAreaElement).value);
    formData.append("stepsToReproduce", (form.elements.namedItem("stepsToReproduce") as HTMLTextAreaElement).value);
    formData.append("expectedBehavior", (form.elements.namedItem("expectedBehavior") as HTMLTextAreaElement).value);
    formData.append("actualBehavior", (form.elements.namedItem("actualBehavior") as HTMLTextAreaElement).value);
    formData.append("browserInfo", getBrowserInfo());

    for (const file of files) {
      formData.append("attachments", file);
    }

    try {
      const ticket = await apiRequest("/api/tickets", {
        method: "POST",
        body: formData,
      });
      navigate(`/track?ticket=${ticket.ticketNumber}&submitted=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Report an Issue
          </CardTitle>
          <CardDescription>
            Help us fix the problem by providing as much detail as possible.
            Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Your Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Your Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="submitterName">Your Name *</Label>
                <Input id="submitterName" name="submitterName" required placeholder="e.g., Brett Thompson" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="submitterEmail">Your Email *</Label>
                <Input id="submitterEmail" name="submitterEmail" type="email" required placeholder="you@trockinc.com" />
              </div>
            </div>
          </div>

          {/* Issue Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Issue Details</h3>

            <div className="space-y-2">
              <Label htmlFor="title">Brief Title *</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="e.g., Budget page won't load for Project 24-089"
              />
              <p className="text-xs text-muted-foreground">Summarize the issue in one short sentence.</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systemAffected">Which System? *</Label>
                <Select id="systemAffected" name="systemAffected" required>
                  <option value="">Select...</option>
                  {SYSTEMS_AFFECTED.map((s) => (
                    <option key={s} value={s}>
                      {SYSTEM_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select id="priority" name="priority" required defaultValue="medium">
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-muted-foreground">Critical = blocks your work entirely</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occurredAt">When Did This Happen? *</Label>
                <Input id="occurredAt" name="occurredAt" type="datetime-local" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatWereYouDoing">What Were You Doing When This Happened? *</Label>
              <Textarea
                id="whatWereYouDoing"
                name="whatWereYouDoing"
                required
                rows={3}
                placeholder="e.g., I was on the Budget tab in Procore trying to add a new line item for Project 24-089..."
              />
              <p className="text-xs text-muted-foreground">
                Tell us the page you were on, what button you clicked, or what action you were performing.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Describe the Issue in Detail *</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={4}
                placeholder="e.g., When I clicked 'Create Budget', the page showed a spinning wheel for about 30 seconds, then displayed an error message that said 'Something went wrong'..."
              />
              <p className="text-xs text-muted-foreground">
                Include any error messages you saw, exactly as they appeared.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedBehavior">What Did You Expect to Happen?</Label>
                <Textarea
                  id="expectedBehavior"
                  name="expectedBehavior"
                  rows={3}
                  placeholder="e.g., The budget should have been created with the line items I entered..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualBehavior">What Actually Happened?</Label>
                <Textarea
                  id="actualBehavior"
                  name="actualBehavior"
                  rows={3}
                  placeholder="e.g., Got an error message and the budget was not created. When I went back, my line items were gone..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stepsToReproduce">Steps to Reproduce (if you can do it again)</Label>
              <Textarea
                id="stepsToReproduce"
                name="stepsToReproduce"
                rows={3}
                placeholder={"1. Go to Procore > Project 24-089 > Budget tab\n2. Click 'Create Budget'\n3. Add a line item\n4. Click Save\n5. Error appears"}
              />
            </div>
          </div>

          {/* Screenshots */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Screenshots & Attachments</h3>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF, PDF, or video — up to 10MB each (max 5 files)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/*,application/pdf,video/mp4,video/quicktime"
                onChange={handleFileChange}
              />
            </div>
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2 text-sm">
                    <span className="truncate">{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700 ml-2">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 rounded-md p-3 text-sm">{error}</div>
          )}

          <Button type="submit" disabled={submitting} className="w-full h-11 text-base">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Submit Issue Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
