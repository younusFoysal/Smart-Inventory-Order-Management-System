import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrder, updateOrderStatus } from "../services/orderService";
import toast from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineXCircle,
} from "react-icons/hi";

const statusConfig = {
  Pending: { color: "bg-yellow-100 text-yellow-700", icon: HiOutlineClock },
  Confirmed: { color: "bg-blue-100 text-blue-700", icon: HiOutlineCheckCircle },
  Shipped: { color: "bg-purple-100 text-purple-700", icon: HiOutlineTruck },
  Delivered: { color: "bg-green-100 text-green-700", icon: HiOutlineCheckCircle },
  Cancelled: { color: "bg-red-100 text-red-700", icon: HiOutlineXCircle },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!order) return null;

  const StatusIcon = statusConfig[order.status]?.icon || HiOutlineClock;
  const transitions = validTransitions[order.status] || [];

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/orders")}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <HiOutlineArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{order.orderNumber}</h2>
          <p className="text-sm text-gray-500">
            Created {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
            })}
          </p>
        </div>
      </div>

      {/* Status & Customer */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Customer</p>
            <p className="text-lg font-semibold text-gray-800">{order.customerName}</p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
              statusConfig[order.status]?.color
            }`}
          >
            <StatusIcon className="h-4 w-4" />
            {order.status}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Order Items</h3>
        <div className="divide-y divide-gray-100">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.productName}</p>
                <p className="text-xs text-gray-500">
                  ${item.price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-800">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-600">Total</span>
          <span className="text-xl font-bold text-gray-800">
            ${order.totalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Actions */}
      {transitions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h3>
          <div className="flex gap-3">
            {transitions.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                disabled={updating}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                  status === "Cancelled"
                    ? "border border-red-300 text-red-600 hover:bg-red-50"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {updating ? "Updating..." : `Mark as ${status}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <HiOutlineXCircle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Cancel Order</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to cancel this order? Stock will be restored for all items.
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Keep Order
              </button>
              <button
                onClick={() => doUpdate("Cancelled")}
                disabled={updating}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {updating ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
