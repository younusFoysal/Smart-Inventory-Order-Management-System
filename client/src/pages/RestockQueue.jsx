import { useState, useEffect } from "react";
import { getRestockQueue, restockProduct } from "../services/restockService";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { RefreshCw, Loader2, PackageCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const priorityVariant = {
  High: "destructive",
  Medium: "warning",
  Low: "secondary",
};

const RestockQueue = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchQueue = async () => {
    try {
      const data = await getRestockQueue();
      setItems(data);
    } catch {
      toast.error("Failed to load restock queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const openModal = (item) => {
    setModalItem(item);
    setQuantity("");
  };

  const closeModal = () => {
    setModalItem(null);
    setQuantity("");
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!qty || qty < 1) return;

    setSubmitting(true);
    try {
      const result = await restockProduct(modalItem._id, qty);
      toast.success(result.message);
      closeModal();
      fetchQueue();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to restock");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Restock Queue</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Products that need restocking based on their stock thresholds
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            fetchQueue();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PackageCheck className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-lg text-muted-foreground">All stocked up!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No products currently need restocking.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Priority</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <p className="font-medium">
                        {item.product?.name || "Unknown Product"}
                      </p>
                      {item.product?.price != null && (
                        <p className="text-xs text-muted-foreground">
                          ${item.product.price.toFixed(2)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-semibold ${
                          item.currentStock <= 0
                            ? "text-red-600"
                            : item.currentStock <= item.threshold / 2
                            ? "text-orange-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {item.currentStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.threshold}
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant[item.priority] || "outline"}>
                        {item.priority}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openModal(item)}
                          >
                            Restock
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Restock Dialog */}
      <Dialog
        open={!!modalItem}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Restock Product</DialogTitle>
          </DialogHeader>

          {modalItem && (
            <>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium">{modalItem.product?.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Current stock: {modalItem.currentStock} · Threshold:{" "}
                  {modalItem.threshold}
                </p>
              </div>

              <form onSubmit={handleRestock}>
                <Label htmlFor="restockQty">Quantity to Add</Label>
                <Input
                  id="restockQty"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  autoFocus
                  placeholder="e.g. 50"
                  className="mt-1.5 mb-4"
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !quantity || Number(quantity) < 1}
                  >
                    {submitting && (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    )}
                    Restock
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestockQueue;
