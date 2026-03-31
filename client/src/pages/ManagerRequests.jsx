import { useState, useEffect } from "react";
import { getIncomingRequests, acceptRequest, declineRequest } from "../services/managerRequestService";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Loader2, CheckCircle2, XCircle, Inbox } from "lucide-react";

const ManagerRequests = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getIncomingRequests();
        setRequests(data);
      } catch {
        toast.error("Failed to load requests");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleAccept = async (requestId) => {
    setSubmitting(true);
    try {
      const result = await acceptRequest(requestId);
      toast.success("Request accepted! You are now a manager.");
      // Reload page to reflect new role
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept request");
    } finally {
      setSubmitting(false);
      setConfirmModal(null);
    }
  };

  const handleDecline = async (requestId) => {
    setSubmitting(true);
    try {
      await declineRequest(requestId);
      toast.success("Request declined");
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to decline request");
    } finally {
      setSubmitting(false);
      setConfirmModal(null);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Manager Requests</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Admin users have invited you to manage their inventory. Accept to become their manager.
        </p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Inbox className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-lg text-muted-foreground">No pending requests</p>
            <p className="text-sm text-muted-foreground mt-1">
              You'll see requests here when an admin invites you to be their manager.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <Card key={req._id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {req.from?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {req.from?.name}{" "}
                      <span className="text-muted-foreground font-normal">
                        wants you to be their manager
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {req.from?.email} · {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmModal({ type: "decline", request: req })}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setConfirmModal({ type: "accept", request: req })}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Accept
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={!!confirmModal}
        onOpenChange={(open) => !open && setConfirmModal(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmModal?.type === "accept" ? "Accept Request" : "Decline Request"}
            </DialogTitle>
          </DialogHeader>
          {confirmModal && (
            <p className="text-sm text-muted-foreground">
              {confirmModal.type === "accept" ? (
                <>
                  Accept the manager request from{" "}
                  <span className="font-medium text-foreground">
                    {confirmModal.request.from?.name}
                  </span>
                  ? You'll become their manager and see their inventory data. Your role will change to manager.
                </>
              ) : (
                <>
                  Decline the request from{" "}
                  <span className="font-medium text-foreground">
                    {confirmModal.request.from?.name}
                  </span>
                  ? They will be notified.
                </>
              )}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModal(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmModal?.type === "decline" ? "destructive" : "default"}
              onClick={() =>
                confirmModal?.type === "accept"
                  ? handleAccept(confirmModal.request._id)
                  : handleDecline(confirmModal.request._id)
              }
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {confirmModal?.type === "accept" ? "Accept" : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerRequests;
