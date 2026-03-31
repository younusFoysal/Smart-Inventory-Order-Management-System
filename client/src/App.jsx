import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public routes (will be added in Phase 2) */}
        <Route
          path="/login"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <h1 className="text-3xl font-bold text-gray-800">
                Login Page — Coming in Phase 2
              </h1>
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <h1 className="text-3xl font-bold text-gray-800">
                Register Page — Coming in Phase 2
              </h1>
            </div>
          }
        />

        {/* Dashboard placeholder (will be protected in Phase 2) */}
        <Route
          path="/dashboard"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-indigo-600 mb-4">
                  Smart Inventory & Order Management
                </h1>
                <p className="text-gray-600 text-lg">
                  Dashboard — Coming in Phase 8
                </p>
                <div className="mt-6 flex gap-4 justify-center">
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                    ✅ React + Vite
                  </span>
                  <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                    ✅ Tailwind CSS
                  </span>
                  <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                    ✅ React Router
                  </span>
                </div>
              </div>
            </div>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <h1 className="text-2xl text-gray-500">404 — Page Not Found</h1>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
