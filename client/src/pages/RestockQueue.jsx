import { useState, useEffect } from "react";
import { getRestockQueue, restockProduct } from "../services/restockService";
import toast from "react-hot-toast";
import {
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
  HiOutlineX,
} from "react-icons/hi";

const priorityConfig = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-orange-100 text-orange-700",
  Low: "bg-yellow-100 text-yellow-700",
};

const RestockQueue = () => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Restock Queue</h2>
          <p className="text-sm text-gray-500 mt-1">
            Products that need restocking based on their stock thresholds
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchQueue(); }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <HiOutlineRefresh className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <HiOutlineExclamationCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">All stocked up!</p>
          <p className="text-gray-400 text-sm mt-1">
            No products currently need restocking.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Threshold
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item._id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-800">
                      {item.product?.name || "Unknown Product"}
                    </p>
                    {item.product?.price != null && (
                      <p className="text-xs text-gray-500">${item.product.price.toFixed(2)}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-semibold ${
                        item.currentStock <= 0
                          ? "text-red-600"
                          : item.currentStock <= item.threshold / 2
                          ? "text-orange-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {item.currentStock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.threshold}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                        priorityConfig[item.priority] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => openModal(item)}
                        className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
                      >
                        Restock
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Restock Modal */}
      {modalItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Restock Product
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <HiOutlineX className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-800">
                {modalItem.product?.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Current stock: {modalItem.currentStock} · Threshold: {modalItem.threshold}
              </p>
            </div>

            <form onSubmit={handleRestock}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity to Add
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition mb-4"
                placeholder="e.g. 50"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !quantity || Number(quantity) < 1}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Restocking..." : "Restock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestockQueue;
