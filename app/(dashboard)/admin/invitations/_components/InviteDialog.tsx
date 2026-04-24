"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FlaskConical, Loader2, Send, UserPlus } from "lucide-react";

interface InviteDialogProps {
  onInvited: () => void;
}

export function InviteDialog({ onInvited }: InviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isTestAccount, setIsTestAccount] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);

    try {
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined, isTestAccount }),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to send invitation");
        return;
      }

      toast.success("Invitation sent successfully");
      setOpen(false);
      setEmail("");
      setName("");
      setIsTestAccount(false);
      onInvited();
    } catch {
      toast.error("An error occurred while sending the invitation");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white text-slate-900 hover:bg-white/92">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Doctor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a Doctor</DialogTitle>
          <DialogDescription>
            Send an invitation email so a doctor can start their registration and
            upload verification documents.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="doctor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={sending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-name">Doctor&apos;s Name (Optional)</Label>
              <Input
                id="invite-name"
                type="text"
                placeholder="Dr. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={sending}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="test-account"
                checked={isTestAccount}
                onCheckedChange={(checked) => setIsTestAccount(checked === true)}
                disabled={sending}
              />
              <Label
                htmlFor="test-account"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <FlaskConical className="h-4 w-4 text-orange-500" />
                Mark as test account
              </Label>
            </div>
            <p className="pl-6 text-xs text-muted-foreground">
              Test accounts remain visible for internal QA and training.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sending || !email}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
