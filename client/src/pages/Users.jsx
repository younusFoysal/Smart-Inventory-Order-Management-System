import { useState, useEffect } from "react";
import { getUsers, updateUserRole } from "../services/userService";
import { sendManagerRequest } from "../services/managerRequestService";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Shield, ShieldCheck, Loader2, Send, UserMinus, Clock, CheckCircle2, XCircle } from "lucide-react";

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSendRequest = async (user) => {
    setSubmitting(true);
    try {
      await sendManagerRequest(user._id);
      toast.success(`Manager request sent to ${user.name}`);
      setConfirmModal(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveManager = async (user) => {
    setSubmitting(true);
    try {
      await updateUserRole(user._id, "admin");
      toast.success(`${user.name} has been reverted to admin`);
      setConfirmModal(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role");
    } finally {
      setSubmitting(false);
    }
  };

  const getRequestBadge = (u) => {
    if (u.requestStatus === "pending") {
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    }
    if (u.requestStatus === "declined") {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> Declined
        </Badge>
      );
    }
    if (u.requestStatus === "accepted") {
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" /> Accepted
        </Badge>
      );
    }
    return null;
  };

  const getActionButton = (u) => {
    // Already a manager assigned to another admin
    if (u.role === "manager" && u.assignedAdmin && u.assignedAdmin !== currentUser?._id) {
      return <span className="text-xs text-muted-foreground">Assigned to another admin</span>;
    }

    // This user is MY manager (accepted request from me)
    if (u.role === "manager" && u.assignedAdmin === currentUser?._id) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() =>
            setConfirmModal({ type: "remove", user: u })
          }
        >
          <UserMinus className="h-3.5 w-3.5 mr-1.5" />
          Remove Manager
        </Button>
      );
    }

    // Pending request already sent
    if (u.requestStatus === "pending") {
      return <span className="text-xs text-muted-foreground">Request sent</span>;
    }

    // Declined — allow re-sending
    if (u.requestStatus === "declined") {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmModal({ type: "send", user: u })}
        >
          <Send className="h-3.5 w-3.5 mr-1.5" />
          Resend Request
        </Button>
      );
    }

    // Default — can send request
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirmModal({ type: "send", user: u })}
      >
        <Send className="h-3.5 w-3.5 mr-1.5" />
        Make Manager
      </Button>
    );
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Send manager requests to other users. They must accept before becoming your manager.
        </p>
      </div>

      {/* Roles info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Admin</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Full access to their own data — manage products, categories,
                orders, restock, and users.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Shield className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Manager</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Can view their assigned admin's data and create orders on their
                behalf.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Request</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u._id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={u.role === "admin" ? "default" : "warning"}
                      className="capitalize"
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{getRequestBadge(u)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      {getActionButton(u)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!confirmModal}
        onOpenChange={(open) => !open && setConfirmModal(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmModal?.type === "send"
                ? "Send Manager Request"
                : "Remove Manager"}
            </DialogTitle>
          </DialogHeader>
          {confirmModal && (
            <p className="text-sm text-muted-foreground">
              {confirmModal.type === "send" ? (
                <>
                  Send a manager request to{" "}
                  <span className="font-medium text-foreground">
                    {confirmModal.user.name}
                  </span>
                  ? They will need to accept it before becoming your manager.
                </>
              ) : (
                <>
                  Remove{" "}
                  <span className="font-medium text-foreground">
                    {confirmModal.user.name}
                  </span>{" "}
                  as your manager? They will be reverted to an admin role.
                </>
              )}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModal(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmModal?.type === "remove" ? "destructive" : "default"}
              onClick={() =>
                confirmModal?.type === "send"
                  ? handleSendRequest(confirmModal.user)
                  : handleRemoveManager(confirmModal.user)
              }
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {confirmModal?.type === "send" ? "Send Request" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
