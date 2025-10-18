// src/stores/teams.js
import { create } from 'zustand';
import { fetchTeams, fetchTeam, createTeam, updateTeam, deleteTeam } from '../services/teams';

export const teamsStore = create((set, get) => ({
  // ========== STATE ==========
  teams: [], // List of all teams
  currentTeam: null, // Currently selected team
  isLoading: false, // Loading state
  error: null, // Error messages

  // Filters and search
  searchQuery: '',
  filters: {
    sortBy: 'name', // Sort by: name, created_date, member_count
  },

  // ========== SELECTORS (use these in components) ==========
  // These are computed based on current state

  // Get team by ID
  getTeamById: (id) => {
    return get().teams.find((team) => team.id === id);
  },

  // ========== ACTIONS ==========

  fetchTeams: async () => {
    set({ isLoading: true, error: null });

    try {
      console.log('📄 Fetching teams from API...');

      const teams = await fetchTeams();
      set({ teams });

      console.log('✅ Teams loaded:', teams.length);
    } catch (error) {
      console.error('❌ Failed to fetch teams:', error);
      set({
        error: 'Failed to load teams. Please check your connection and try again.',
        teams: get().teams.length === 0 ? [] : get().teams
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTeam: async (id) => {
    set({ isLoading: true, error: null });

    try {
      console.log(`📄 Fetching team ${id}...`);

      const existingTeam = get().getTeamById(id);
      if (existingTeam) {
        set({ currentTeam: existingTeam, isLoading: false });
        return;
      }

      const team = await fetchTeam(id);
      set({ currentTeam: team });

      if (team) {
        console.log('✅ Team loaded:', team.name);
      } else {
        throw new Error('Team not found');
      }
    } catch (error) {
      console.error('❌ Failed to fetch team:', error);
      set({ error: 'Failed to load team details.' });
    } finally {
      set({ isLoading: false });
    }
  },

  createTeam: async (teamData) => {
    set({ isLoading: true, error: null });

    try {
      console.log('📄 Creating team:', teamData.name);

      const newTeam = await createTeam(teamData);
      set((state) => ({ teams: [...state.teams, newTeam] }));

      console.log('✅ Team created:', newTeam.name);

      return { success: true, team: newTeam };
    } catch (error) {
      console.error('❌ Failed to create team:', error);
      const errorMsg = error.message || 'Failed to create team';
      set({ error: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      set({ isLoading: false });
    }
  },

  updateTeam: async (id, teamData) => {
    set({ isLoading: true, error: null });

    try {
      console.log(`📄 Updating team ${id}...`);

      const updatedTeam = await updateTeam(id, teamData);

      const teams = get().teams;
      const index = teams.findIndex((t) => t.id === id);

      if (index === -1) {
        throw new Error('Team not found');
      }

      const newTeams = [...teams];
      newTeams[index] = updatedTeam;

      // Update current team if it's the same
      const currentTeam = get().currentTeam?.id === id ? updatedTeam : get().currentTeam;

      set({ teams: newTeams, currentTeam });

      console.log('✅ Team updated:', updatedTeam.name);
      return { success: true, team: updatedTeam };
    } catch (error) {
      console.error('❌ Failed to update team:', error);
      const errorMsg = error.message || 'Failed to update team';
      set({ error: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTeam: async (id) => {
    set({ isLoading: true, error: null });

    try {
      console.log(`📄 Deleting team ${id}...`);

      await deleteTeam(id);

      const teams = get().teams;
      console.log(`teams ${teams}`);

      const teamIndex = teams.findIndex((t) => t.id === id);
      if (teamIndex === -1) {
        throw new Error('Team not found');
      }

      const teamName = teams[teamIndex].name;
      const newTeams = teams.filter((t) => t.id !== id);

      // Clear current team if it's the deleted one
      const currentTeam = get().currentTeam?.id === parseInt(id) ? null : get().currentTeam;

      set({ teams: newTeams, currentTeam });

      console.log('✅ Team deleted:', teamName);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete team:', error);
      const errorMsg = error.message || 'Failed to delete team';
      set({ error: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      set({ isLoading: false });
    }
  },

  // Set search query
  setSearchQuery: (query) => {
    set({ searchQuery: query || '' });
  },

  // Update filters
  updateFilters: (newFilters) => {
    console.log('new filters', newFilters);
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  // Clear search and filters
  clearFilters: () => {
    set({
      searchQuery: '',
      filters: {
        sortBy: 'name',
      }
    });
  },

  // Clear error message
  clearError: () => {
    set({ error: null });
  },

  // Reset store to initial state
  resetStore: () => {
    set({
      teams: [],
      currentTeam: null,
      isLoading: false,
      error: null,
      searchQuery: '',
      filters: {
        sortBy: 'name',
      }
    });
  },
}));

// ========== SELECTORS (use these for computed values) ==========
// These return new values based on state, Zustand handles equality checking

export const selectFilteredTeams = (state) => {
  let filtered = state.teams;

  // Apply search filter
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = state.teams.filter(
      (team) =>
        team.name?.toLowerCase().includes(query) ||
        (team.city && team.city.toLowerCase().includes(query))
    );
  }

  // Apply sorting - IMPORTANT: Don't mutate, create new sorted array
  const sorted = [...filtered].sort((a, b) => {
    switch (state.filters.sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'created_at':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      case 'active_member_count':
        return (b.active_member_count || 0) - (a.active_member_count || 0);
      default:
        return 0;
    }
  });

  return sorted;
};

export const selectTeamsCount = (state) => state.teams.length;

export const selectTotalMembers = (state) =>
  state.teams.reduce((sum, team) => sum + (team.member_count || 0), 0);

export const selectFullTeams = (state) =>
  state.teams.filter((t) => t.member_count >= (t.max_members || 22));

export const selectAlmostFullTeams = (state) =>
  state.teams.filter((t) => {
    const maxMembers = t.max_members || 22;
    return t.member_count > maxMembers * 0.8 && t.member_count < maxMembers;
  });

// ========== HOOK FOR COMPONENTS ==========
export const useTeamsStore = (selector) => {
  if (selector) {
    return teamsStore(selector);
  }
  return teamsStore();
};
