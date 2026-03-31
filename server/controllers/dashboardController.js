const Order = require("../models/Order");
const Product = require("../models/Product");
const getDataOwner = require("../utils/getDataOwner");

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = getDataOwner(req);

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Run all queries in parallel
    const [
      totalOrdersToday,
      pendingOrders,
      completedOrders,
      revenueResult,
      products,
      recentOrders,
    ] = await Promise.all([
      // Total orders today
      Order.countDocuments({
        user: userId,
        createdAt: { $gte: todayStart, $lte: todayEnd },
      }),
      // Pending orders count
      Order.countDocuments({ user: userId, status: "Pending" }),
      // Completed (Delivered) orders count
      Order.countDocuments({ user: userId, status: "Delivered" }),
      // Revenue today (sum of delivered orders' totalPrice for today)
      Order.aggregate([
        {
          $match: {
            user: userId,
            status: "Delivered",
            createdAt: { $gte: todayStart, $lte: todayEnd },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      // All products with stock and status
      Product.find({ user: userId })
        .populate("category", "name")
        .sort({ stockQuantity: 1 }),
      // Orders from last 7 days for chart
      Order.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const revenueToday = revenueResult.length > 0 ? revenueResult[0].total : 0;
    const lowStockItems = products.filter(
      (p) => p.stockQuantity <= p.minStockThreshold
    ).length;

    // Build chart data for last 7 days (fill missing days with 0)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const found = recentOrders.find((r) => r._id === dateStr);
      chartData.push({
        date: dateStr,
        orders: found ? found.count : 0,
        revenue: found ? found.revenue : 0,
      });
    }

    res.json({
      totalOrdersToday,
      pendingOrders,
      completedOrders,
      lowStockItems,
      revenueToday,
      products,
      chartData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
