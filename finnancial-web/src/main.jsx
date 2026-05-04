import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import './styles/variables.css'
import App from './App.jsx'

// Limpeza Forçada do Cash de SQLite ("Corrija para mim")
if (!localStorage.getItem('mongo_migration_done')) {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('mongo_migration_done', 'true');
  window.location.reload();
}

import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
        <Toaster position="top-right" />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
