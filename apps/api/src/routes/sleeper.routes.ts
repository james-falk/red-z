import { Router, Response } from 'express';
import prisma from '../db/client';
import { sleeperConnectSchema } from '@fantasy-red-zone/shared';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { sleeperService } from '../services/sleeper.service';

const router = Router();

// Get Sleeper connection status
router.get('/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const account = await prisma.userSleeperAccount.findUnique({
      where: { userId: req.user!.id }
    });

    res.json({
      connected: !!account,
      sleeperUserId: account?.sleeperUserId || null,
      sleeperUsername: account?.sleeperUsername || null
    });
  } catch (error) {
    console.error('Error fetching Sleeper status:', error);
    res.status(500).json({ error: 'Failed to fetch Sleeper status' });
  }
});

// Connect Sleeper account by username
router.post(
  '/connect',
  authenticateToken,
  validateRequest(sleeperConnectSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { username } = req.body;

      // Fetch user from Sleeper API
      const sleeperUser = await sleeperService.getUserByUsername(username);

      if (!sleeperUser) {
        return res.status(404).json({ error: 'Sleeper user not found' });
      }

      // Upsert Sleeper account
      const account = await prisma.userSleeperAccount.upsert({
        where: { userId: req.user!.id },
        create: {
          userId: req.user!.id,
          sleeperUserId: sleeperUser.user_id,
          sleeperUsername: sleeperUser.username
        },
        update: {
          sleeperUserId: sleeperUser.user_id,
          sleeperUsername: sleeperUser.username,
          updatedAt: new Date()
        }
      });

      res.json({
        connected: true,
        sleeperUserId: account.sleeperUserId,
        sleeperUsername: account.sleeperUsername
      });
    } catch (error) {
      console.error('Error connecting Sleeper account:', error);
      res.status(500).json({ error: 'Failed to connect Sleeper account' });
    }
  }
);

// Disconnect Sleeper account
router.delete('/disconnect', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.userSleeperAccount.delete({
      where: { userId: req.user!.id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error disconnecting Sleeper account:', error);
    res.status(500).json({ error: 'Failed to disconnect Sleeper account' });
  }
});

// Sync Sleeper leagues and rosters
router.post('/sync', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const account = await prisma.userSleeperAccount.findUnique({
      where: { userId: req.user!.id }
    });

    if (!account) {
      return res.status(404).json({ error: 'Sleeper account not connected' });
    }

    const season = sleeperService.getCurrentSeason();
    const leagues = await sleeperService.getUserLeagues(account.sleeperUserId, season);

    let syncedLeagues = 0;
    let syncedRosters = 0;

    for (const league of leagues) {
      // Upsert league
      await prisma.sleeperLeague.upsert({
        where: {
          userId_leagueId_season: {
            userId: req.user!.id,
            leagueId: league.league_id,
            season: league.season
          }
        },
        create: {
          userId: req.user!.id,
          leagueId: league.league_id,
          season: league.season,
          name: league.name,
          metadata: {
            status: league.status,
            settings: league.settings,
            scoringSettings: league.scoring_settings
          }
        },
        update: {
          name: league.name,
          metadata: {
            status: league.status,
            settings: league.settings,
            scoringSettings: league.scoring_settings
          },
          updatedAt: new Date()
        }
      });

      syncedLeagues++;

      // Fetch and store rosters
      const rosters = await sleeperService.getLeagueRosters(league.league_id);

      for (const roster of rosters) {
        await prisma.sleeperRoster.upsert({
          where: {
            leagueId_rosterId: {
              leagueId: league.league_id,
              rosterId: roster.roster_id
            }
          },
          create: {
            userId: req.user!.id,
            leagueId: league.league_id,
            rosterId: roster.roster_id,
            players: roster.players || []
          },
          update: {
            players: roster.players || [],
            updatedAt: new Date()
          }
        });

        syncedRosters++;
      }
    }

    res.json({
      success: true,
      syncedLeagues,
      syncedRosters,
      season
    });
  } catch (error) {
    console.error('Error syncing Sleeper data:', error);
    res.status(500).json({ error: 'Failed to sync Sleeper data' });
  }
});

/**
 * GET /api/integrations/sleeper/roster-content/:leagueId
 * Get content relevant to user's roster players
 */
router.get('/roster-content/:leagueId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { leagueId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const account = await prisma.userSleeperAccount.findUnique({
      where: { userId: req.user!.id }
    });

    if (!account) {
      return res.status(404).json({ error: 'Sleeper account not connected' });
    }

    const content = await sleeperService.getRosterRelevantContent(
      account.sleeperUserId,
      leagueId,
      limit
    );

    res.json({
      content,
      total: content.length
    });
  } catch (error) {
    console.error('Error fetching roster content:', error);
    res.status(500).json({ error: 'Failed to fetch roster content' });
  }
});

/**
 * POST /api/integrations/sleeper/player-content
 * Get content for specific players
 * Body: { players: string[] }
 */
router.post('/player-content', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { players } = req.body;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!players || !Array.isArray(players)) {
      return res.status(400).json({ error: 'players array is required' });
    }

    const content = await sleeperService.getPlayerContent(players, limit);

    res.json({
      content,
      total: content.length
    });
  } catch (error) {
    console.error('Error fetching player content:', error);
    res.status(500).json({ error: 'Failed to fetch player content' });
  }
});

export default router;
