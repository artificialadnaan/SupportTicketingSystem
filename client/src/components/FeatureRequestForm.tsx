import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, X, Lightbulb, CheckCircle2, Loader2 } from "lucide-react";
import { apiRequest, getBrowserInfo } from "@/lib/utils";
import {
  SYSTEMS_AFFECTED,
  SYSTEM_LABELS,
  TICKET_PRIORITIES,
  PRIORITY_LABELS,
  WORKFLOW_AREAS,
} from "@shared/types";

export default function FeatureRequestForm() {
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

    formData.append("type", "feature_request");
    formData.append("submitterName", (form.elements.namedItem("submitterName") as HTMLInputElement).value);
    formData.append("submitterEmail", (form.elements.namedItem("submitterEmail") as HTMLInputElement).value);
    formData.append("title", (form.elements.namedItem("title") as HTMLInputElement).value);
    formData.append("systemAffected", (form.elements.namedItem("systemAffected") as HTMLSelectElement).value);
    formData.append("priority", (form.elements.namedItem("priority") as HTMLSelectElement).value);
    formData.append("workflowArea", (form.elements.namedItem("workflowArea") as HTMLSelectElement).value);
    formData.append("description", (form.elements.namedItem("description") as HTMLTextAreaElement).value);
    formData.append("currentProcess", (form.elements.namedItem("currentProcess") as HTMLTextAreaElement).value);
    formData.append("desiredOutcome", (form.elements.namedItem("desiredOutcome") as HTMLTextAreaElement).value);
    formData.append("businessImpact", (form.elements.namedItem("businessImpact") as HTMLTextAreaElement).value);
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
      setError(err instanceof Error ? err.message : "Failed to submit request");
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
          <CardTitle className="text-blue-700 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Request a Feature
          </CardTitle>
          <CardDescription>
            Tell us how we can improve your workflow. The more context you provide,
            the better we can build what you need.
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

          {/* Feature Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Feature Details</h3>

            <div className="space-y-2">
              <Label htmlFor="title">What Feature Are You Requesting? *</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="e.g., Auto-assign project managers when a bid is won"
              />
              <p className="text-xs text-muted-foreground">Give it a short, clear name.</p>
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
                <Label htmlFor="workflowArea">Workflow Area *</Label>
                <Select id="workflowArea" name="workflowArea" required>
                  <option value="">Select...</option>
                  {WORKFLOW_AREAS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Impact Level *</Label>
                <Select id="priority" name="priority" required defaultValue="medium">
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-muted-foreground">How much would this help?</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Describe the Feature *</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={4}
                placeholder="e.g., When a bid is marked as 'Won' in the Bid Board, the system should automatically assign the default project manager from the project template and send them a notification..."
              />
              <p className="text-xs text-muted-foreground">
                What should it do? Be as specific as you can.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentProcess">How Do You Handle This Now? *</Label>
              <Textarea
                id="currentProcess"
                name="currentProcess"
                required
                rows={3}
                placeholder="e.g., Right now I have to manually go into each new project in Procore and assign the PM, then send them an email or Slack message to let them know..."
              />
              <p className="text-xs text-muted-foreground">
                This helps us understand the pain point and what manual work this would eliminate.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desiredOutcome">What Would Success Look Like?</Label>
              <Textarea
                id="desiredOutcome"
                name="desiredOutcome"
                rows={3}
                placeholder="e.g., PM gets auto-assigned and auto-notified within 5 minutes of a bid being won, no manual steps needed..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessImpact">Why Does This Matter? (Business Impact)</Label>
              <Textarea
                id="businessImpact"
                name="businessImpact"
                rows={3}
                placeholder="e.g., This would save about 30 minutes per project and eliminate the risk of PMs not being notified about new projects, which has caused delays in project kickoff..."
              />
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Screenshots or Mockups (Optional)
            </h3>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">
                Screenshots, sketches, or examples — up to 10MB each (max 5 files)
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
                Submit Feature Request
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
