export default function AdminDashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard 
          title="Pending Startups" 
          count={5} 
          description="Startups waiting for approval"
          link="/admin/moderation" 
        />
        <DashboardCard 
          title="Total Users" 
          count={128} 
          description="Registered users"
          link="/admin/users" 
        />
        <DashboardCard 
          title="This Week" 
          count={24} 
          description="New registrations"
          link="/admin/analytics" 
        />
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg border p-4">
          <ul className="divide-y">
            <ActivityItem 
              action="Startup approved" 
              target="TechSolutions Inc." 
              time="2 hours ago" 
            />
            <ActivityItem 
              action="New user registered" 
              target="john.doe@example.com" 
              time="5 hours ago" 
            />
            <ActivityItem 
              action="Startup rejected" 
              target="FailedVenture" 
              time="Yesterday" 
            />
            <ActivityItem 
              action="Role updated" 
              target="sarah.smith@example.com" 
              time="2 days ago" 
            />
            <ActivityItem 
              action="Analytics report generated" 
              target="Monthly Overview" 
              time="3 days ago" 
            />
          </ul>
        </div>
      </div>
    </div>
  )
}

function DashboardCard({ title, count, description, link }) {
  return (
    <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-3xl font-bold mt-2">{count}</p>
      <p className="text-gray-500 text-sm mt-1">{description}</p>
      <a 
        href={link} 
        className="inline-block mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
      >
        View Details →
      </a>
    </div>
  )
}

function ActivityItem({ action, target, time }) {
  return (
    <li className="py-3 flex justify-between">
      <div>
        <span className="font-medium">{action}</span>
        <span className="text-gray-500"> - {target}</span>
      </div>
      <span className="text-gray-400 text-sm">{time}</span>
    </li>
  )
} 