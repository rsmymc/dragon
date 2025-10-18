import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeamsStore } from '../../stores/teams';
import styles from '../../assets/styles/teams-list.module.css';

const TeamsView = () => {
  const navigate = useNavigate();

  // Get state from store - subscribe to individual values
  const teams = useTeamsStore((state) => state.teams);
  const isLoading = useTeamsStore((state) => state.isLoading);
  const error = useTeamsStore((state) => state.error);
  const searchQuery = useTeamsStore((state) => state.searchQuery);
  const sortBy = useTeamsStore((state) => state.filters.sortBy);

  const fetchTeams = useTeamsStore((state) => state.fetchTeams);
  const setSearchQuery = useTeamsStore((state) => state.setSearchQuery);
  const updateFilters = useTeamsStore((state) => state.updateFilters);
  const deleteTeamAction = useTeamsStore((state) => state.deleteTeam);

  // Compute filtered teams in the component using useMemo
  const filteredTeams = useMemo(() => {
    let filtered = teams;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = teams.filter(
        (team) =>
          team.name?.toLowerCase().includes(query) ||
          (team.city && team.city.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
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
  }, [teams, searchQuery, sortBy]);

  // Load teams when component mounts
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Methods
  const createTeam = () => {
    navigate('/teams/create');
  };

  const viewTeam = (teamId) => {
    navigate(`/teams/${teamId}`);
  };

  const editTeam = (teamId) => {
    navigate(`/teams/${teamId}/edit?from=list`);
  };

  const deleteTeam = async (team) => {
    // Create custom confirmation dialog
    const confirmed = await showDeleteConfirmation(team);
    if (!confirmed) return;

    try {
      const result = await deleteTeamAction(team.id);
      if (result.success) {
        // Show success message
        showNotification('success', `Team "${team.name}" deleted successfully`);
      } else {
        // Show error message
        showNotification('error', result.error || 'Failed to delete team');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      showNotification('error', 'An unexpected error occurred');
    }
  };

  // Enhanced confirmation function
  const showDeleteConfirmation = (team) => {
    return new Promise((resolve) => {
      const message =
        `Are you sure you want to delete "${team.name}"?\n\n` +
        `This action cannot be undone and will:\n` +
        `• Remove the team permanently\n` +
        `• Remove all associated data\n` +
        `• Affect ${team.active_member_count || 0} team members`;

      const confirmed = window.confirm(message);
      resolve(confirmed);
    });
  };

  // Simple notification function (you can enhance this with a toast library)
  const showNotification = (type, message) => {
    if (type === 'success') {
      console.log('✅ SUCCESS:', message);
      // You can replace this with a toast notification
    } else {
      console.error('❌ ERROR:', message);
      // You can replace this with a toast notification
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSortChange = (e) => {
    updateFilters({ sortBy: e.target.value });
  };

  return (
    <div className={styles.teamsPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Teams</h1>
        </div>
        <div className={styles.headerRight}>
          <button onClick={createTeam} className={styles.btnPrimary}>
            <svg className={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Create Team
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <div className={styles.searchInputContainer}>
            <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              value={searchQuery}
              onChange={handleSearchChange}
              type="text"
              placeholder="Search teams by name or description..."
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.filters}>
          <select
            value={sortBy}
            onChange={handleSortChange}
            className={styles.filterSelect}
          >
            <option value="name">Sort by Name</option>
            <option value="created_at">Sort by Date Created</option>
            <option value="active_member_count">Sort by Member Count</option>
          </select>
        </div>
      </div>

      {/* Teams Content */}
      <div className={styles.teamsContent}>
        {/* Loading State */}
        {isLoading && (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading teams...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className={styles.errorState}>
            <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3>Error Loading Teams</h3>
            <p>{error}</p>
            <button onClick={fetchTeams} className={styles.btnSecondary}>
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredTeams.length === 0 && (
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3>No Teams Found</h3>
            {searchQuery ? (
              <p>No teams match your search criteria</p>
            ) : (
              <p>Get started by creating your first dragon boat team</p>
            )}
            <button onClick={createTeam} className={styles.btnPrimary}>
              Create Your First Team
            </button>
          </div>
        )}

        {/* Teams Grid */}
        {!isLoading && !error && filteredTeams.length > 0 && (
          <div className={styles.teamsGrid}>
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                className={styles.teamCard}
                onClick={() => viewTeam(team.id)}
              >
                {/* Team Card Header */}
                <div className={styles.cardHeader}>
                  <h3 className={styles.teamName}>{team.name}</h3>
                  <div className={styles.teamActions} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => editTeam(team.id)}
                      className={styles.actionBtnTeamList}
                      title="Edit Team"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteTeam(team)}
                      className={`${styles.actionBtnTeamList} delete`}
                      title="Delete Team"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Team Stats */}
                <div className={styles.teamStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Members</span>
                    <span className={styles.statValue}>
                      {team.active_member_count || 0}/{team.max_members || 22}
                    </span>
                  </div>

                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>City</span>
                    <span className={styles.statValue}>{team.city || 'Not assigned'}</span>
                  </div>
                </div>

                {/* Team Status and Progress */}
                <div className={styles.teamFooter}>
                  <div className={styles.memberProgress}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width: `${Math.min(((team.active_member_count || 0) / (team.max_members || 22)) * 100, 100)}%`,
                          backgroundColor:
                            team.active_member_count >= team.max_members ? '#10b981' : '#3b82f6',
                        }}
                      ></div>
                    </div>
                    <span className={styles.progressText}>
                      {Math.round(((team.active_member_count || 0) / (team.max_members || 22)) * 100)}% full
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsView;
