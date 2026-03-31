import { useState, useEffect } from "react";
import { getUsers, updateUserRole } from "../services/userService";
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
import { Shield, ShieldCheck, Loader2 } from "lucide-react";

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleModal, setRoleModal] = useState(null); // { userId, name, currentRole, newRole }
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
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
    fetchUsers();
  }, []);

  const openRoleModal = (user, newRole) => {
    setRoleModal({
      userId: user._id,
      name: user.name,
      currentRole: user.role,
      newRole,
    });
  };

  const handleRoleUpdate = async () => {
    if (!roleModal) return;
    setUpdating(true);
    try {
      const updated = await updateUserRole(roleModal.userId, roleModal.newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === updated._id ? { ...u, role: updated.role } : u))
      );
      toast.success(`${roleModal.name} is now ${roleModal.newRole}`);
      setRoleModal(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage user roles. Admins have full access, managers can only view data
          and create orders.
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
                Full access — manage products, categories, orders, restock, and
                users.
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
                View only — can browse data and create orders. Cannot modify
                products or categories.
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
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isSelf = u._id === currentUser?._id;
                return (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium">
                      {u.name}
                      {isSelf && (
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          You
                        </Badge>
                      )}
                    </TableCell>
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
                    <TableCell className="text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        {isSelf ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : u.role === "admin" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRoleModal(u, "manager")}
                          >
                            Make Manager
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRoleModal(u, "admin")}
                          >
                            Make Admin
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role change confirmation dialog */}
      <Dialog
        open={!!roleModal}
        onOpenChange={(open) => !open && setRoleModal(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          {roleModal && (
            <p className="text-sm text-muted-foreground">
              Change <span className="font-medium text-foreground">{roleModal.name}</span>{" "}
              from{" "}
              <Badge variant="outline" className="capitalize mx-0.5">
                {roleModal.currentRole}
              </Badge>{" "}
              to{" "}
              <Badge
                variant={roleModal.newRole === "admin" ? "default" : "warning"}
                className="capitalize mx-0.5"
              >
                {roleModal.newRole}
              </Badge>
              ?
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleRoleUpdate} disabled={updating}>
              {updating && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
