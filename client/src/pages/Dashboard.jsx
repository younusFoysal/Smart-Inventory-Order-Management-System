import ActivityLog from "../components/ActivityLog";

const Dashboard = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {["Total Orders Today", "Pending Orders", "Low Stock Items", "Revenue Today"].map(
          (title) => (
            <div
              key={title}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <p className="text-sm text-gray-500">{title}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">—</p>
            </div>
          )
        )}
      </div>
      <div className="mt-8">
        <ActivityLog />
      </div>
    </div>
  );
};

export default Dashboard;
