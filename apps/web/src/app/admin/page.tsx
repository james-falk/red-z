'use client';

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Admin Dashboard
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Featured Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
            </div>
            <div className="text-4xl">⭐</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sources</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
            </div>
            <div className="text-4xl">📡</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Content</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
            </div>
            <div className="text-4xl">📰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/featured"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900">Manage Featured Content</p>
              <p className="text-sm text-gray-600">Add or remove featured items</p>
            </div>
            <span className="text-2xl">→</span>
          </a>

          <a
            href="/admin/sources"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900">Manage Sources</p>
              <p className="text-sm text-gray-600">Add, edit, or disable sources</p>
            </div>
            <span className="text-2xl">→</span>
          </a>

          <a
            href="/admin/ingestion"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900">Trigger Ingestion</p>
              <p className="text-sm text-gray-600">Manually fetch new content</p>
            </div>
            <span className="text-2xl">→</span>
          </a>

          <a
            href="/admin/users"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900">Manage Users</p>
              <p className="text-sm text-gray-600">View and manage user accounts</p>
            </div>
            <span className="text-2xl">→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
