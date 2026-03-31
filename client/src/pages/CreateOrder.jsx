import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../services/orderService";
import { getProducts } from "../services/productService";
import toast from "react-hot-toast";
import { HiOutlinePlus, HiOutlineTrash, HiOutlineExclamation } from "react-icons/hi";

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

  // Check for duplicate products
  const getDuplicateIndex = (index) => {
    const productId = items[index]?.product;
    if (!productId) return false;
    return items.findIndex((item, i) => i !== index && item.product === productId) !== -1;
  };

  // Get product details for an item
  const getProductInfo = (productId) => {
    return products.find((p) => p._id === productId);
  };

  // Check if quantity exceeds stock
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

  // Calculate total price
  const totalPrice = items.reduce((sum, item) => {
    if (!item.product) return sum;
    const product = getProductInfo(item.product);
    return sum + (product?.price || 0) * (item.quantity || 0);
  }, 0);

  // Validate form
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Order</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Name */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="e.g. John Doe"
          />
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Order Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition"
            >
              <HiOutlinePlus className="h-4 w-4" />
              Add Item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No items added yet. Click &quot;Add Item&quot; to start.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => {
                const isDuplicate = getDuplicateIndex(index);
                const stockWarning = getStockWarning(index);
                const product = getProductInfo(item.product);

                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex gap-3 items-start">
                      {/* Product selector */}
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">
                          Product
                        </label>
                        <select
                          value={item.product}
                          onChange={(e) => updateItem(index, "product", e.target.value)}
                          required
                          className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
                            isDuplicate
                              ? "border-red-300 focus:ring-red-500"
                              : "border-gray-300 focus:ring-indigo-500"
                          } focus:ring-2`}
                        >
                          <option value="">Select product</option>
                          {activeProducts.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} — ${p.price.toFixed(2)} (Stock: {p.stockQuantity})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="w-28">
                        <label className="block text-xs text-gray-500 mb-1">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", Number(e.target.value))
                          }
                          required
                          className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
                            stockWarning
                              ? "border-red-300 focus:ring-red-500"
                              : "border-gray-300 focus:ring-indigo-500"
                          } focus:ring-2`}
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="w-24 pt-5">
                        <p className="text-sm font-medium text-gray-800 text-right">
                          ${product ? (product.price * item.quantity).toFixed(2) : "0.00"}
                        </p>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="mt-5 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Warnings */}
                    {isDuplicate && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
                        <HiOutlineExclamation className="h-3.5 w-3.5" />
                        This product is already added to the order.
                      </div>
                    )}
                    {stockWarning && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
                        <HiOutlineExclamation className="h-3.5 w-3.5" />
                        {stockWarning}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Total & Submit */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">Total Price</span>
            <span className="text-2xl font-bold text-gray-800">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || hasErrors()}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create Order"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;
