import { useState, useEffect } from "react";
import { getActivityLogs } from "../services/activityService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Package, TrendingUp, RefreshCw } from "lucide-react";

const typeConfig = {
  order: { icon: ShoppingCart, color: "text-blue-600 bg-blue-100" },
  product: { icon: Package, color: "text-purple-600 bg-purple-100" },
  stock: { icon: TrendingUp, color: "text-orange-600 bg-orange-100" },
  restock: { icon: RefreshCw, color: "text-emerald-600 bg-emerald-100" },
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
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
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
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{log.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {timeAgo(log.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLog;
