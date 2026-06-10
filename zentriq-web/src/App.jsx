import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';

import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Subscriptions from './pages/Subscriptions';
import CreditCards from './pages/CreditCards';
import Investments from './pages/Investments';
import Chat from './pages/Chat';

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    <span style={{ fontSize: 18, color: 'var(--text-tertiary)' }}>Carregando...</span>
  </div>
);

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <PageLoader />;
  }
  return isAuthenticated ? (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  ) : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
}

export default function App() {
  const router = createHashRouter([
    { path: '/login', element: <PublicRoute><Login /></PublicRoute> },
    { path: '/register', element: <PublicRoute><Register /></PublicRoute> },
    {
      path: '/',
      element: <PrivateRoute><AppLayout /></PrivateRoute>,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        { path: 'dashboard', element: <Dashboard /> },
        { path: 'accounts', element: <Accounts /> },
        { path: 'credit-cards', element: <CreditCards /> },
        { path: 'transactions', element: <Transactions /> },
        { path: 'budgets', element: <Budgets /> },
        { path: 'goals', element: <Goals /> },
        { path: 'reports', element: <Reports /> },
        { path: 'subscriptions', element: <Subscriptions /> },
        { path: 'settings', element: <Settings /> },
        { path: 'investments', element: <Investments /> },
        { path: 'chat', element: <Chat /> },
      ],
    },
    { path: '*', element: <Navigate to="/dashboard" replace /> },
  ]);

  return <RouterProvider router={router} />;
}
