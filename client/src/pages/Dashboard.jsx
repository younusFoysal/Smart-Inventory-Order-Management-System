import { useState, useEffect } from "react";
import { getDashboardStats } from "../services/dashboardService";
import ActivityLog from "../components/ActivityLog";
import {
  HiOutlineShoppingCart,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineCurrencyDollar,
} from "react-icons/hi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Orders Today",
      value: stats.totalOrdersToday,
      icon: HiOutlineShoppingCart,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: HiOutlineClock,
      color: "text-yellow-600 bg-yellow-50",
    },
    {
      title: "Completed Orders",
      value: stats.completedOrders,
      icon: HiOutlineCheckCircle,
      color: "text-green-600 bg-green-50",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems,
      icon: HiOutlineExclamationCircle,
      color: "text-red-600 bg-red-50",
    },
  ];

  const chartData = stats.chartData.map((d) => ({
    ...d,
    label: new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
          <HiOutlineCurrencyDollar className="h-4 w-4" />
          Revenue Today: ${stats.revenueToday.toLocaleString()}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
            >
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${card.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Orders Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Orders — Last 7 Days
          </h3>
          {chartData.every((d) => d.orders === 0) ? (
            <p className="text-sm text-gray-400 text-center py-12">
              No orders in the last 7 days
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) =>
                    name === "revenue"
                      ? [`$${value.toLocaleString()}`, "Revenue"]
                      : [value, "Orders"]
                  }
                />
                <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-1">
          <ActivityLog />
        </div>
      </div>

      {/* Product Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Product Summary
        </h3>
        {stats.products.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No products yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.products.map((p) => (
                  <tr
                    key={p._id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="py-2.5 text-sm text-gray-800">{p.name}</td>
                    <td className="py-2.5 text-sm text-gray-500">
                      {p.category?.name || "—"}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`text-sm font-medium ${
                          p.stockQuantity <= 0
                            ? "text-red-600"
                            : p.stockQuantity <= p.minStockThreshold
                            ? "text-orange-600"
                            : "text-gray-800"
                        }`}
                      >
                        {p.stockQuantity}
                      </span>
                      {p.stockQuantity <= p.minStockThreshold &&
                        p.stockQuantity > 0 && (
                          <span className="ml-1.5 text-xs text-orange-500">Low</span>
                        )}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          p.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
