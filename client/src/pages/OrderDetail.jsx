import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrder, updateOrderStatus } from "../services/orderService";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageSkeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Loader2,
} from "lucide-react";

const statusConfig = {
  Pending: { variant: "warning", icon: Clock },
  Confirmed: { variant: "info", icon: CheckCircle2 },
  Shipped: { variant: "secondary", icon: Truck },
  Delivered: { variant: "success", icon: CheckCircle2 },
  Cancelled: { variant: "destructive", icon: XCircle },
};

const validTransitions = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const data = await getOrder(id);
      setOrder(data);
    } catch {
      toast.error("Failed to load order");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === "Cancelled") {
      setShowCancelConfirm(true);
      return;
    }
    await doUpdate(newStatus);
  };

  const doUpdate = async (newStatus) => {
    setUpdating(true);
    setShowCancelConfirm(false);
    try {
      const data = await updateOrderStatus(id, newStatus);
      setOrder(data);
      toast.success(`Order ${newStatus.toLowerCase()} successfully!`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <PageSkeleton />;
  if (!order) return null;

  const config = statusConfig[order.status] || statusConfig.Pending;
  const StatusIcon = config.icon;
  const transitions = validTransitions[order.status] || [];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/orders")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {order.orderNumber}
          </h2>
          <p className="text-sm text-muted-foreground">
            Created{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* Status & Customer */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Customer</p>
            <p className="text-lg font-semibold">{order.customerName}</p>
          </div>
          <Badge variant={config.variant} className="gap-1.5 px-3 py-1.5 text-sm">
            <StatusIcon className="h-3.5 w-3.5" />
            {order.status}
          </Badge>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    ${item.price.toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total</span>
            <span className="text-xl font-bold">
              ${order.totalPrice.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {transitions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Update Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {transitions.map((status) => (
                <Button
                  key={status}
                  variant={status === "Cancelled" ? "outline" : "default"}
                  className={
                    status === "Cancelled"
                      ? "border-destructive text-destructive hover:bg-destructive/10"
                      : ""
                  }
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updating}
                >
                  {updating && (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  )}
                  Mark as {status}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={showCancelConfirm}
        onOpenChange={(open) => !open && setShowCancelConfirm(false)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle>Cancel Order</DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to cancel this order? Stock will be restored
            for all items. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(false)}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={() => doUpdate("Cancelled")}
              disabled={updating}
            >
              {updating && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetail;
