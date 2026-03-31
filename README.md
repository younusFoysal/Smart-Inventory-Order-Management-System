# Smart Inventory & Order Management System

A full-stack web application for managing products, stock levels, customer orders, and fulfillment workflows — with role-based access control, a manager request system, and real-time dashboard analytics.

---

## Live Demo

- **Frontend:** https://inventory-client-pi.vercel.app
- **Backend API:** https://inventory-server-pi.vercel.app
- **Demo Login:** `demo@example.com` / `demo1234`

---

## Tech Stack

| Layer      | Technology                                                    |
| ---------- | ------------------------------------------------------------- |
| Frontend   | React 19, Vite 8, Tailwind CSS 4, shadcn/ui (Radix UI + CVA) |
| Backend    | Express.js 5, Node.js                                        |
| Database   | MongoDB Atlas (Mongoose ODM)                                  |
| Auth       | JWT (JSON Web Tokens), bcryptjs                               |
| Charts     | ApexCharts (react-apexcharts)                                 |
| Icons      | Lucide React                                                  |
| Toasts     | Sonner                                                        |
| Deployment | Vercel (frontend + backend)                                   |

---

## Features

### Authentication
- User registration and login with email + password
- JWT-based authentication (7-day expiry)
- **Demo Login** button for quick access with pre-filled credentials
- Protected routes — unauthenticated users are redirected to login

### Category Management
- Create, edit, and delete product categories
- Duplicate category name prevention (case-insensitive)
- Categories with products cannot be deleted (cascade protection)

### Product Management
- Full CRUD for products (name, category, price, stock quantity, min stock threshold)
- Automatic status management: **Active** or **Out of Stock**
- Search products by name
- Filter by category and status
- Low stock warning badges on products below threshold

### Order Management
- Create orders with customer name and multiple product items
- Auto-calculated total price
- Order status workflow: **Pending → Confirmed → Shipped → Delivered**
- Cancel orders at any stage (stock is restored on cancellation)
- Filter orders by status and date range
- Detailed order view with product breakdown

### Stock Handling
- Automatic stock deduction when orders are placed
- Prevents ordering more than available stock ("Only X items available")
- Prevents ordering out-of-stock or inactive products
- Duplicate product detection within the same order
- Stock restoration when orders are cancelled

### Restock Queue
- Products automatically added to restock queue when stock falls below threshold
- Priority levels: **High** (zero stock), **Medium** (below half threshold), **Low**
- Sorted by lowest stock first
- Manual restock action: enter quantity → stock updated, item resolved
- Refresh to see current queue state

### Dashboard
- **Total Orders Today** — orders placed in the current day
- **Pending Orders** — orders awaiting processing
- **Completed Orders** — delivered order count
- **Revenue Today** — total revenue from delivered orders today
- **Low Stock Items** — count of products below threshold
- **Product Summary** — full product list with stock levels and status
- **7-Day Orders & Revenue Chart** — visual trend using ApexCharts

### Activity Log
- Tracks the 10 most recent system actions
- Logs product creation/updates, order creation, restocking events
- Timestamped entries with action type badges

---

## Role-Based Access Control (RBAC)

The system has two roles: **Admin** and **Manager**. Every new user starts as an **Admin**.

### Admin Role

Admins have **full control** over their own data:

| Capability                   | Admin |
| ---------------------------- | ----- |
| Create / Edit / Delete Categories | ✅    |
| Create / Edit / Delete Products   | ✅    |
| Create Orders                     | ✅    |
| Update Order Status               | ✅    |
| Restock Products                  | ✅    |
| View Dashboard & Activity Log     | ✅    |
| Manage Users (send manager requests) | ✅ |
| View Manager Requests             | ✅    |

**Data isolation:** Each admin sees **only their own data**. Admin A cannot see Admin B's categories, products, orders, or any other data.

### Manager Role

Managers are assigned to a specific admin and can **view that admin's data** and create orders on their behalf.

| Capability                   | Manager |
| ---------------------------- | ------- |
| View Categories              | ✅ (admin's data) |
| Create / Edit / Delete Categories | ❌ |
| View Products                | ✅ (admin's data) |
| Create / Edit / Delete Products   | ❌ |
| Create Orders                | ✅ (for admin's products) |
| Update Order Status          | ✅ |
| View Orders                  | ✅ (admin's data) |
| Restock Products             | ❌ |
| View Dashboard & Activity Log | ✅ (admin's data) |
| Manage Users                 | ❌ |
| View Manager Requests        | ✅ |

### How the Manager Request System Works

Managers are **not** assigned directly. Instead, the system uses an **invitation-based request flow**:

1. **Admin sends a request:** On the **Users** page, an admin clicks **"Make Manager"** next to another user. This sends a manager request — it does **not** immediately change the user's role.

2. **Target user receives the request:** The target user sees the incoming request on their **Requests** page, showing which admin wants them as their manager.

3. **Accept or Decline:**
   - **Accept** → The user's role changes to **Manager**, and they are linked to that admin. They now see the admin's data instead of their own. All other pending requests are automatically declined.
   - **Decline** → The admin sees a "Declined" status on the Users page and can resend the request later.

4. **Remove a manager:** The admin can click **"Remove Manager"** to revert a manager back to an admin role, clearing the assignment.

5. **Restrictions:**
   - An admin **cannot** send a request to a user who is already a manager for another admin (shows "Assigned to another admin").
   - An admin **cannot** change their own role.
   - Only **one pending request** per admin-target pair at a time.

### Request Status States

| Status     | Meaning                                            |
| ---------- | -------------------------------------------------- |
| `pending`  | Request sent, awaiting target user's response      |
| `accepted` | Target accepted — they are now a manager           |
| `declined` | Target declined — admin can resend if needed       |

---

## Project Structure

```
EAP/
├── server/                     # Express.js Backend
│   ├── config/db.js            # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js       # Register, login, getMe
│   │   ├── categoryController.js   # Category CRUD
│   │   ├── productController.js    # Product CRUD
│   │   ├── orderController.js      # Order CRUD + stock handling
│   │   ├── restockController.js    # Restock queue & restock action
│   │   ├── activityController.js   # Activity log retrieval
│   │   ├── dashboardController.js  # Dashboard statistics
│   │   ├── userController.js       # User list & role management
│   │   └── managerRequestController.js # Manager request system
│   ├── middleware/auth.js      # JWT protect + role authorize
│   ├── models/
│   │   ├── User.js             # name, email, password, role, assignedAdmin
│   │   ├── Category.js         # name, user
│   │   ├── Product.js          # name, category, price, stock, status, user
│   │   ├── Order.js            # customerName, items, totalPrice, status, user
│   │   ├── RestockQueue.js     # product, currentStock, threshold, priority, user
│   │   ├── ActivityLog.js      # action, type, user
│   │   └── ManagerRequest.js   # from, to, status
│   ├── routes/                 # Express route definitions
│   ├── utils/
│   │   ├── logActivity.js      # Fire-and-forget activity logger
│   │   ├── getDataOwner.js     # Returns admin ID (for data scoping)
│   │   └── seed.js             # Demo user seeder
│   ├── index.js                # Express app entry point
│   └── package.json
│
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui components (button, card, table, etc.)
│   │   │   └── PrivateRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Auth state, login/register/logout
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx # Sidebar, topbar, role-based nav
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Categories.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── CreateOrder.jsx
│   │   │   ├── OrderDetail.jsx
│   │   │   ├── RestockQueue.jsx
│   │   │   ├── Users.jsx       # Admin: manage users & send requests
│   │   │   └── ManagerRequests.jsx # Accept/decline incoming requests
│   │   ├── services/           # Axios API call functions
│   │   └── App.jsx             # Routes
│   ├── vercel.json             # SPA rewrite rules
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/younusFoysal/Smart-Inventory-Order-Management-System.git
cd smart-inventory
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

The API will be available at `http://localhost:5001/api`.

### 3. Frontend Setup

```bash
cd client
npm install
```

Create a `.env` file in `client/`:

```env
VITE_API_URL=http://localhost:5001/api
```

Start the frontend:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 4. Seed Demo User (Optional)

```bash
cd server
npm run seed
```

This creates a demo account: `demo@example.com` / `demo1234`.

---

## Environment Variables

### Backend (`server/.env`)

| Variable     | Description                        | Example                            |
| ------------ | ---------------------------------- | ---------------------------------- |
| `PORT`       | Server port                        | `5001`                             |
| `MONGO_URI`  | MongoDB Atlas connection string    | `mongodb+srv://...`                |
| `JWT_SECRET` | Secret key for JWT signing         | `my_super_secret_key`              |
| `CLIENT_URL` | Frontend URL (for CORS)            | `http://localhost:5173`            |

### Frontend (`client/.env`)

| Variable       | Description          | Example                          |
| -------------- | -------------------- | -------------------------------- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:5001/api`      |

---

## API Endpoints

### Auth
| Method | Endpoint             | Description         | Auth     |
| ------ | -------------------- | ------------------- | -------- |
| POST   | `/api/auth/register` | Register new user   | Public   |
| POST   | `/api/auth/login`    | Login               | Public   |
| GET    | `/api/auth/me`       | Get current user    | Required |

### Categories
| Method | Endpoint              | Description        | Auth        |
| ------ | --------------------- | ------------------ | ----------- |
| GET    | `/api/categories`     | List categories    | Required    |
| POST   | `/api/categories`     | Create category    | Admin only  |
| PUT    | `/api/categories/:id` | Update category    | Admin only  |
| DELETE | `/api/categories/:id` | Delete category    | Admin only  |

### Products
| Method | Endpoint             | Description       | Auth        |
| ------ | -------------------- | ----------------- | ----------- |
| GET    | `/api/products`      | List products     | Required    |
| GET    | `/api/products/:id`  | Get product       | Required    |
| POST   | `/api/products`      | Create product    | Admin only  |
| PUT    | `/api/products/:id`  | Update product    | Admin only  |
| DELETE | `/api/products/:id`  | Delete product    | Admin only  |

### Orders
| Method | Endpoint                  | Description         | Auth     |
| ------ | ------------------------- | ------------------- | -------- |
| GET    | `/api/orders`             | List orders         | Required |
| GET    | `/api/orders/:id`         | Get order detail    | Required |
| POST   | `/api/orders`             | Create order        | Required |
| PUT    | `/api/orders/:id/status`  | Update order status | Required |

### Restock Queue
| Method | Endpoint           | Description        | Auth        |
| ------ | ------------------ | ------------------ | ----------- |
| GET    | `/api/restock`     | Get restock queue  | Required    |
| PUT    | `/api/restock/:id` | Restock a product  | Admin only  |

### Dashboard & Activity
| Method | Endpoint              | Description         | Auth     |
| ------ | --------------------- | ------------------- | -------- |
| GET    | `/api/dashboard/stats`| Dashboard stats     | Required |
| GET    | `/api/activity`       | Recent activity log | Required |

### Users (Admin only)
| Method | Endpoint               | Description         | Auth        |
| ------ | ---------------------- | ------------------- | ----------- |
| GET    | `/api/users`           | List all users      | Admin only  |
| PUT    | `/api/users/:id/role`  | Update user role    | Admin only  |

### Manager Requests
| Method | Endpoint                              | Description          | Auth        |
| ------ | ------------------------------------- | -------------------- | ----------- |
| POST   | `/api/manager-requests`               | Send request         | Admin only  |
| GET    | `/api/manager-requests/incoming`      | Incoming requests    | Required    |
| GET    | `/api/manager-requests/outgoing`      | Outgoing requests    | Admin only  |
| PUT    | `/api/manager-requests/:id/accept`    | Accept request       | Required    |
| PUT    | `/api/manager-requests/:id/decline`   | Decline request      | Required    |
