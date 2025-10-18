// src/router/index.jsx
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { authStore } from "../stores/auth";

// Layouts
import AuthLayout from "../layouts/AuthLayout";
import AppLayout from "../layouts/AppLayout";

// Views
import LoginView from "../views/LoginView";
import TeamsView from "../views/TeamsView";
/*import CreateTeamView from '../views/teams/CreateTeamView';
import EditTeamView from '../views/teams/EditTeamView';
import TeamDetailView from '../views/teams/TeamDetailView';
import EditPersonView from '../views/teams/EditPersonView';
import TeamTrainingsView from '../views/trainings/TeamTrainingsView';
import TrainingDetailsView from '../views/trainings/TrainingDetailsView';
import PersonView from '../views/PersonView';
import SettingsView from '../views/SettingsView';*/

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { access } = authStore.getState();
  const isAuthenticated = !!access;

  if (!isAuthenticated) {
    const currentPath = window.location.pathname + window.location.search;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(currentPath)}`}
        replace
      />
    );
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

// Guest Route Wrapper
const GuestRoute = () => {
  const { access } = authStore.getState();
  const isAuthenticated = !!access;

  if (isAuthenticated) {
    return <Navigate to="/teams" replace />;
  }

  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
};

// Router Configuration
const router = createBrowserRouter([
  // Root redirect
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },

  // Auth routes (Guest only)
  {
    element: <GuestRoute />,
    children: [
      {
        path: "/login",
        element: <LoginView />,
      },
    ],
  },

  // Protected routes (Authenticated only)
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/teams",
        element: <TeamsView />,
      },
      /* {
                path: '/teams/create',
                element: <CreateTeamView />,
            },
            {
                path: '/teams/:id',
                element: <TeamDetailView />,
            },
            {
                path: '/teams/:id/edit',
                element: <EditTeamView />,
            },
            {
                path: '/persons',
                element: <PersonView />,
            },
            {
                path: '/persons/:id/edit',
                element: <EditPersonView />,
            },
            {
                path: '/teams/:teamId/trainings',
                element: <TeamTrainingsView />,
            },
            {
                path: '/teams/:teamId/trainings/:id',
                element: <TrainingDetailsView />,
            },
            {
                path: '/settings',
                element: <SettingsView />,
            },*/
    ],
  },
]);

export default router;
