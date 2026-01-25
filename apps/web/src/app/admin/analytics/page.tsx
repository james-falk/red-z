'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface PlatformMetrics {
  users: {
    total: number;
    activeLastWeek: number;
    activeLastMonth: number;
    newThisWeek: number;
  };
  content: {
    total: number;
    thisWeek: number;
    byType: Record<string, number>;
    bySource: Array<{ sourceName: string; count: number }>;
  };
  engagement: {
    totalSaves: number;
    totalClicks: number;
    avgClicksPerContent: number;
    topContent: Array<{
      id: string;
      title: string;
      clicks: number;
      saves: number;
    }>;
  };
  sources: {
    total: number;
    active: number;
    topPerformers: Array<{
      id: string;
      name: string;
      contentCount: number;
      totalClicks: number;
    }>;
  };
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/admin');
      return;
    }

    fetchMetrics();
  }, [session, status, router]);

  const fetchMetrics = async () => {
    try {
      const response = await apiClient.get('/analytics/metrics');
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <button
          onClick={() => fetchMetrics()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {/* User Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Users"
            value={metrics.users.total}
            icon="👥"
            color="blue"
          />
          <MetricCard
            title="Active (7 days)"
            value={metrics.users.activeLastWeek}
            subtitle={`${((metrics.users.activeLastWeek / metrics.users.total) * 100).toFixed(1)}% of total`}
            icon="📊"
            color="green"
          />
          <MetricCard
            title="Active (30 days)"
            value={metrics.users.activeLastMonth}
            subtitle={`${((metrics.users.activeLastMonth / metrics.users.total) * 100).toFixed(1)}% of total`}
            icon="📈"
            color="purple"
          />
          <MetricCard
            title="New This Week"
            value={metrics.users.newThisWeek}
            icon="✨"
            color="orange"
          />
        </div>
      </div>

      {/* Content Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Content"
            value={metrics.content.total}
            icon="📝"
            color="blue"
          />
          <MetricCard
            title="Published This Week"
            value={metrics.content.thisWeek}
            icon="🆕"
            color="green"
          />
          <MetricCard
            title="Videos"
            value={metrics.content.byType.VIDEO || 0}
            icon="🎥"
            color="red"
          />
          <MetricCard
            title="Articles"
            value={metrics.content.byType.ARTICLE || 0}
            icon="📰"
            color="yellow"
          />
        </div>
      </div>

      {/* Engagement Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Total Saves"
            value={metrics.engagement.totalSaves}
            icon="💾"
            color="purple"
          />
          <MetricCard
            title="Total Clicks"
            value={metrics.engagement.totalClicks}
            icon="👆"
            color="blue"
          />
          <MetricCard
            title="Avg Clicks/Content"
            value={metrics.engagement.avgClicksPerContent.toFixed(1)}
            icon="📊"
            color="green"
          />
        </div>
      </div>

      {/* Top Content */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Content</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saves
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.engagement.topContent.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-md truncate">
                    {item.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.clicks}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.saves}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Sources */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Sources</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content Count
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Clicks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.sources.topPerformers.map((source) => (
                <tr key={source.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {source.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {source.contentCount}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {source.totalClicks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
}) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg shadow-sm p-4 sm:p-6 text-white`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl sm:text-3xl">{icon}</span>
        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-bold">{value}</div>
        </div>
      </div>
      <div className="text-sm sm:text-base font-medium opacity-90">{title}</div>
      {subtitle && <div className="text-xs sm:text-sm opacity-75 mt-1">{subtitle}</div>}
    </div>
  );
}
