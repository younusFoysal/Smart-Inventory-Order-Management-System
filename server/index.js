const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Routes (will be added in later phases)
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
// app.use("/api/restock", require("./routes/restockRoutes"));
// app.use("/api/activity", require("./routes/activityRoutes"));
// app.use("/api/dashboard", require("./routes/dashboardRoutes"));

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
