import { useState, useEffect } from "react";
import { getDashboardStats } from "../services/dashboardService";
import ActivityLog from "../components/ActivityLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import Chart from "react-apexcharts";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!stats) return null;

  const statCards = [
    {
      title: "Orders Today",
      value: stats.totalOrdersToday,
      icon: ShoppingCart,
      color: "text-blue-600 bg-blue-100",
    },
    {
      title: "Pending",
      value: stats.pendingOrders,
      icon: Clock,
      color: "text-amber-600 bg-amber-100",
    },
    {
      title: "Completed",
      value: stats.completedOrders,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      title: "Low Stock",
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: "text-red-600 bg-red-100",
    },
  ];

  const chartLabels = stats.chartData.map((d) =>
    new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  );

  const chartOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "50%" } },
    colors: ["hsl(221.2 83.2% 53.3%)"],
    dataLabels: { enabled: false },
    xaxis: { categories: chartLabels, labels: { style: { fontSize: "12px" } } },
    yaxis: { labels: { style: { fontSize: "12px" } }, forceNiceScale: true },
    grid: { borderColor: "hsl(var(--border))", strokeDashArray: 4 },
    tooltip: { theme: "light" },
  };
  const chartSeries = [
    { name: "Orders", data: stats.chartData.map((d) => d.orders) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <Badge variant="success" className="gap-1.5 px-3 py-1.5 text-sm">
          <DollarSign className="h-3.5 w-3.5" />
          Revenue Today: ${stats.revenueToday.toLocaleString()}
        </Badge>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${card.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Orders — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.chartData.every((d) => d.orders === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                No orders in the last 7 days
              </p>
            ) : (
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="bar"
                height={240}
              />
            )}
          </CardContent>
        </Card>
        <div className="lg:col-span-1">
          <ActivityLog />
        </div>
      </div>

      {/* Product Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Product Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No products yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.products.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.category?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${
                          p.stockQuantity <= 0
                            ? "text-red-600"
                            : p.stockQuantity <= p.minStockThreshold
                            ? "text-orange-600"
                            : ""
                        }`}
                      >
                        {p.stockQuantity}
                      </span>
                      {p.stockQuantity <= p.minStockThreshold &&
                        p.stockQuantity > 0 && (
                          <Badge variant="warning" className="ml-2 text-[10px]">
                            Low
                          </Badge>
                        )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === "Active" ? "success" : "destructive"
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
