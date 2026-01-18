import axios from 'axios';

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
}

export const sleeperService = new SleeperService();
