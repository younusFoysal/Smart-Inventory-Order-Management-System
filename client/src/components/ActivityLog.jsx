import { useState, useEffect } from "react";
import { getActivityLogs } from "../services/activityService";
import {
  HiOutlineShoppingCart,
  HiOutlineCube,
  HiOutlineRefresh,
  HiOutlineTrendingUp,
} from "react-icons/hi";

const typeConfig = {
  order: { icon: HiOutlineShoppingCart, color: "text-blue-500 bg-blue-50" },
  product: { icon: HiOutlineCube, color: "text-purple-500 bg-purple-50" },
  stock: { icon: HiOutlineTrendingUp, color: "text-orange-500 bg-orange-50" },
  restock: { icon: HiOutlineRefresh, color: "text-green-500 bg-green-50" },
};

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getActivityLogs();
        setLogs(data);
      } catch {
        // fail silently — non-critical widget
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h3>
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h3>

      {logs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const config = typeConfig[log.type] || typeConfig.product;
            const Icon = config.icon;
            return (
              <div key={log._id} className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-snug">{log.action}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {timeAgo(log.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
