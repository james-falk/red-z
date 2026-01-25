/**
 * Analytics Service
 * 
 * Provides platform metrics and insights for admin dashboard
 */

import prisma from '../db/client';

export interface PlatformMetrics {
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

export interface TimeSeriesData {
  date: string;
  value: number;
}

class AnalyticsService {
  /**
   * Get comprehensive platform metrics
   */
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User metrics
    const totalUsers = await prisma.user.count();
    const activeLastWeek = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: oneWeekAgo
        }
      }
    });
    const activeLastMonth = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: oneMonthAgo
        }
      }
    });
    const newThisWeek = await prisma.user.count({
      where: {
        createdAt: {
          gte: oneWeekAgo
        }
      }
    });

    // Content metrics
    const totalContent = await prisma.content.count();
    const contentThisWeek = await prisma.content.count({
      where: {
        publishedAt: {
          gte: oneWeekAgo
        }
      }
    });

    const contentByType = await prisma.content.groupBy({
      by: ['type'],
      _count: true
    });

    const contentBySource = await prisma.content.groupBy({
      by: ['sourceId'],
      _count: true,
      orderBy: {
        _count: {
          sourceId: 'desc'
        }
      },
      take: 10
    });

    const sourceIds = contentBySource.map(c => c.sourceId);
    const sources = await prisma.source.findMany({
      where: { id: { in: sourceIds } },
      select: { id: true, name: true }
    });

    // Engagement metrics
    const totalSaves = await prisma.savedContent.count();
    const totalClicks = await prisma.content.aggregate({
      _sum: { clickCount: true }
    });

    const topContent = await prisma.content.findMany({
      take: 10,
      orderBy: [
        { clickCount: 'desc' },
        { savedByUsers: { _count: 'desc' } }
      ],
      select: {
        id: true,
        title: true,
        clickCount: true,
        _count: {
          select: {
            savedByUsers: true
          }
        }
      }
    });

    // Source metrics
    const totalSources = await prisma.source.count();
    const activeSources = await prisma.source.count({
      where: {
        lastIngestedAt: {
          gte: oneWeekAgo
        }
      }
    });

    const topPerformingSources = await prisma.source.findMany({
      take: 10,
      include: {
        _count: {
          select: { content: true }
        },
        content: {
          select: { clickCount: true }
        }
      },
      orderBy: {
        content: {
          _count: 'desc'
        }
      }
    });

    return {
      users: {
        total: totalUsers,
        activeLastWeek,
        activeLastMonth,
        newThisWeek
      },
      content: {
        total: totalContent,
        thisWeek: contentThisWeek,
        byType: Object.fromEntries(
          contentByType.map(item => [item.type, item._count])
        ),
        bySource: contentBySource.map(item => {
          const source = sources.find(s => s.id === item.sourceId);
          return {
            sourceName: source?.name || 'Unknown',
            count: item._count
          };
        })
      },
      engagement: {
        totalSaves,
        totalClicks: totalClicks._sum.clickCount || 0,
        avgClicksPerContent: totalContent > 0 ? (totalClicks._sum.clickCount || 0) / totalContent : 0,
        topContent: topContent.map(item => ({
          id: item.id,
          title: item.title,
          clicks: item.clickCount,
          saves: item._count.savedByUsers
        }))
      },
      sources: {
        total: totalSources,
        active: activeSources,
        topPerformers: topPerformingSources.map(source => ({
          id: source.id,
          name: source.name,
          contentCount: source._count.content,
          totalClicks: source.content.reduce((sum, c) => sum + c.clickCount, 0)
        }))
      }
    };
  }

  /**
   * Get content publication time series
   */
  async getContentTimeSeries(days: number = 30): Promise<TimeSeriesData[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const content = await prisma.content.findMany({
      where: {
        publishedAt: {
          gte: startDate
        }
      },
      select: {
        publishedAt: true
      }
    });

    // Group by date
    const dateMap = new Map<string, number>();
    content.forEach(item => {
      const date = new Date(item.publishedAt).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    // Fill in missing dates
    const result: TimeSeriesData[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        value: dateMap.get(dateStr) || 0
      });
    }

    return result.reverse();
  }

  /**
   * Get user growth time series
   */
  async getUserGrowthTimeSeries(days: number = 30): Promise<TimeSeriesData[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        createdAt: true
      }
    });

    // Group by date
    const dateMap = new Map<string, number>();
    users.forEach(user => {
      const date = new Date(user.createdAt).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    // Fill in missing dates with cumulative count
    const result: TimeSeriesData[] = [];
    let cumulative = 0;
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      cumulative += (dateMap.get(dateStr) || 0);
      result.push({
        date: dateStr,
        value: cumulative
      });
    }

    return result.reverse();
  }

  /**
   * Get engagement metrics over time
   */
  async getEngagementTimeSeries(days: number = 30): Promise<{
    saves: TimeSeriesData[];
    clicks: TimeSeriesData[];
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const saves = await prisma.savedContent.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        createdAt: true
      }
    });

    // Group saves by date
    const savesMap = new Map<string, number>();
    saves.forEach(save => {
      const date = new Date(save.createdAt).toISOString().split('T')[0];
      savesMap.set(date, (savesMap.get(date) || 0) + 1);
    });

    // Build time series
    const savesResult: TimeSeriesData[] = [];
    const clicksResult: TimeSeriesData[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      savesResult.push({
        date: dateStr,
        value: savesMap.get(dateStr) || 0
      });
      // Clicks would need to be tracked with timestamps (not currently in schema)
      clicksResult.push({
        date: dateStr,
        value: 0 // TODO: Track click timestamps
      });
    }

    return {
      saves: savesResult.reverse(),
      clicks: clicksResult.reverse()
    };
  }
}

export const analyticsService = new AnalyticsService();
