import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../services/orderService";
import { getProducts } from "../services/productService";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, AlertCircle, Loader2 } from "lucide-react";

const CreateOrder = () => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const activeProducts = products.filter((p) => p.status === "Active");

  const addItem = () => {
    setItems((prev) => [...prev, { product: "", quantity: 1 }]);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const getDuplicateIndex = (index) => {
    const productId = items[index]?.product;
    if (!productId) return false;
    return items.findIndex((item, i) => i !== index && item.product === productId) !== -1;
  };

  const getProductInfo = (productId) => {
    return products.find((p) => p._id === productId);
  };

  const getStockWarning = (index) => {
    const item = items[index];
    if (!item?.product || !item.quantity) return null;
    const product = getProductInfo(item.product);
    if (!product) return null;
    if (item.quantity > product.stockQuantity) {
      return `Only ${product.stockQuantity} items available in stock`;
    }
    return null;
  };

  const totalPrice = items.reduce((sum, item) => {
    if (!item.product) return sum;
    const product = getProductInfo(item.product);
    return sum + (product?.price || 0) * (item.quantity || 0);
  }, 0);

  const hasErrors = () => {
    if (!customerName.trim()) return true;
    if (items.length === 0) return true;
    return items.some((item, i) => {
      if (!item.product || !item.quantity || item.quantity < 1) return true;
      if (getDuplicateIndex(i)) return true;
      if (getStockWarning(i)) return true;
      return false;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasErrors()) return;

    setSubmitting(true);
    try {
      const orderData = {
        customerName: customerName.trim(),
        items: items.map((item) => ({
          product: item.product,
          quantity: Number(item.quantity),
        })),
      };
      await createOrder(orderData);
      toast.success("Order created successfully!");
      navigate("/orders");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Create Order</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Name */}
        <Card>
          <CardContent className="p-6">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              placeholder="e.g. John Doe"
              className="mt-1.5"
            />
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Order Items</CardTitle>
              <Button type="button" variant="ghost" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No items added yet. Click &quot;Add Item&quot; to start.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => {
                  const isDuplicate = getDuplicateIndex(index);
                  const stockWarning = getStockWarning(index);
                  const product = getProductInfo(item.product);

                  return (
                    <div
                      key={index}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">
                            Product
                          </Label>
                          <select
                            value={item.product}
                            onChange={(e) =>
                              updateItem(index, "product", e.target.value)
                            }
                            required
                            className={`mt-1 flex h-9 w-full rounded-md border px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              isDuplicate
                                ? "border-destructive focus:ring-destructive"
                                : "border-input focus:ring-ring"
                            } bg-background`}
                          >
                            <option value="">Select product</option>
                            {activeProducts.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name} — ${p.price.toFixed(2)} (Stock:{" "}
                                {p.stockQuantity})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-28">
                          <Label className="text-xs text-muted-foreground">
                            Qty
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", Number(e.target.value))
                            }
                            required
                            className={`mt-1 ${
                              stockWarning ? "border-destructive focus-visible:ring-destructive" : ""
                            }`}
                          />
                        </div>

                        <div className="w-24 pt-6">
                          <p className="text-sm font-medium text-right">
                            $
                            {product
                              ? (product.price * item.quantity).toFixed(2)
                              : "0.00"}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-5 h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {isDuplicate && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
                          <AlertCircle className="h-3.5 w-3.5" />
                          This product is already added to the order.
                        </div>
                      )}
                      {stockWarning && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {stockWarning}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total & Submit */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Total Price
              </span>
              <span className="text-2xl font-bold">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/orders")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={submitting || hasErrors()}
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                )}
                Create Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default CreateOrder;
