import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy load das páginas principais para reduzir bundle inicial
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Goals = lazy(() => import('./pages/Goals'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

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
        { path: 'transactions', element: <Transactions /> },
        { path: 'budgets', element: <Budgets /> },
        { path: 'goals', element: <Goals /> },
        { path: 'reports', element: <Reports /> },
        { path: 'settings', element: <Settings /> },
      ],
    },
    { path: '*', element: <Navigate to="/dashboard" replace /> },
  ]);

  return <RouterProvider router={router} />;
}
