import axios from 'axios';
import prisma from '../db/client';

const SLEEPER_API_URL = process.env.SLEEPER_API_URL || 'https://api.sleeper.app/v1';

export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
}

export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  status: string;
  settings: any;
  scoring_settings: any;
  roster_positions: string[];
  total_rosters: number;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  players: string[];
  starters: string[];
  settings: any;
}

export interface SleeperPlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string;
  team: string;
  status: string;
  injury_status?: string;
}

export interface RosterRelevantContent {
  contentId: string;
  playerId: string;
  playerName: string;
  relevanceScore: number;
  reason: 'roster_player' | 'starter' | 'injury' | 'team_news';
}

export class SleeperService {
  async getUserByUsername(username: string): Promise<SleeperUser | null> {
    try {
      const response = await axios.get(`${SLEEPER_API_URL}/user/${username}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getUserLeagues(userId: string, season: string): Promise<SleeperLeague[]> {
    try {
      const response = await axios.get(`${SLEEPER_API_URL}/user/${userId}/leagues/nfl/${season}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user leagues:', error);
      return [];
    }
  }

  async getLeagueRosters(leagueId: string): Promise<SleeperRoster[]> {
    try {
      const response = await axios.get(`${SLEEPER_API_URL}/league/${leagueId}/rosters`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching league rosters:', error);
      return [];
    }
  }

  getCurrentSeason(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // NFL season typically starts in September
    // If before September, use previous year
    return month < 8 ? (year - 1).toString() : year.toString();
  }

  /**
   * Get all players from Sleeper API
   * Note: This is cached on Sleeper's side, only updates weekly
   */
  async getAllPlayers(): Promise<Record<string, SleeperPlayer>> {
    try {
      const response = await axios.get(`${SLEEPER_API_URL}/players/nfl`);
      return response.data || {};
    } catch (error) {
      console.error('Error fetching all players:', error);
      return {};
    }
  }

  /**
   * Get roster-relevant content for a user
   * Returns content that mentions players on their rosters
   */
  async getRosterRelevantContent(
    userId: string,
    leagueId: string,
    limit: number = 20
  ): Promise<any[]> {
    try {
      // Get user's roster
      const rosters = await this.getLeagueRosters(leagueId);
      const userRoster = rosters.find(r => r.owner_id === userId);
      
      if (!userRoster || !userRoster.players || userRoster.players.length === 0) {
        return [];
      }

      // Get all players data
      const allPlayers = await this.getAllPlayers();
      
      // Map player IDs to player names
      const playerNames = userRoster.players
        .map(playerId => {
          const player = allPlayers[playerId];
          return player ? player.full_name : null;
        })
        .filter(Boolean) as string[];

      if (playerNames.length === 0) {
        return [];
      }

      // Search for content that mentions these players
      // We'll search tags for player names
      const content = await prisma.content.findMany({
        where: {
          OR: playerNames.map(name => ({
            contentTags: {
              some: {
                tag: {
                  type: 'PLAYER',
                  name: {
                    contains: name,
                    mode: 'insensitive'
                  }
                }
              }
            }
          }))
        },
        include: {
          source: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              websiteUrl: true
            }
          },
          contentTags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  type: true
                }
              }
            }
          }
        },
        orderBy: {
          publishedAt: 'desc'
        },
        take: limit
      });

      // Add relevance scoring
      const scoredContent = content.map(item => {
        const playerTags = item.contentTags.filter(ct => ct.tag.type === 'PLAYER');
        const matchedPlayers = playerTags.filter(pt => 
          playerNames.some(name => 
            name.toLowerCase().includes(pt.tag.name.toLowerCase()) ||
            pt.tag.name.toLowerCase().includes(name.toLowerCase())
          )
        );

        // Higher score if player is a starter
        const isStarter = matchedPlayers.some(pt => {
          const matchedPlayerId = Object.entries(allPlayers).find(
            ([_, player]) => player.full_name === pt.tag.name
          )?.[0];
          return matchedPlayerId && userRoster.starters.includes(matchedPlayerId);
        });

        return {
          ...item,
          tags: item.contentTags.map(ct => ct.tag),
          relevanceScore: isStarter ? 1.0 : 0.8,
          matchedPlayers: matchedPlayers.map(pt => pt.tag.name)
        };
      });

      // Sort by relevance and date
      return scoredContent.sort((a, b) => {
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
    } catch (error) {
      console.error('Error getting roster-relevant content:', error);
      return [];
    }
  }

  /**
   * Get content for specific players
   */
  async getPlayerContent(playerNames: string[], limit: number = 10): Promise<any[]> {
    if (playerNames.length === 0) {
      return [];
    }

    try {
      const content = await prisma.content.findMany({
        where: {
          OR: playerNames.map(name => ({
            contentTags: {
              some: {
                tag: {
                  type: 'PLAYER',
                  name: {
                    contains: name,
                    mode: 'insensitive'
                  }
                }
              }
            }
          }))
        },
        include: {
          source: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              websiteUrl: true
            }
          },
          contentTags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  type: true
                }
              }
            }
          }
        },
        orderBy: {
          publishedAt: 'desc'
        },
        take: limit
      });

      return content.map(item => ({
        ...item,
        tags: item.contentTags.map(ct => ct.tag)
      }));
    } catch (error) {
      console.error('Error getting player content:', error);
      return [];
    }
  }
}

export const sleeperService = new SleeperService();
