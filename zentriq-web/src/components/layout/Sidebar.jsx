import { NavLink } from 'react-router-dom';
import { TrendingUp, LayoutDashboard, Receipt, Wallet, Target, BarChart3, Settings, LogOut, X, CreditCard, Repeat, Briefcase, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

const navLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts', icon: Wallet, label: 'Contas' },
  { to: '/credit-cards', icon: CreditCard, label: 'Cartões' },
  { to: '/transactions', icon: Receipt, label: 'Transações' },
  { to: '/subscriptions', icon: Repeat, label: 'Assinaturas' },
  { to: '/budgets', icon: Target, label: 'Orçamentos' },
  { to: '/goals', icon: TrendingUp, label: 'Metas' },
  { to: '/investments', icon: Briefcase, label: 'Investimentos' },
  { to: '/reports', icon: BarChart3, label: 'Relatórios' },
  { to: '/chat', icon: MessageSquare, label: 'Assistente IA' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

export function Sidebar({ isOpen, onClose, mobile = false }) {
  const { user, logout } = useAuth();
  const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';

  if (mobile) {
    if (!isOpen) return null;
    return (
      <>
        <div className={styles.drawerOverlay} onClick={onClose} />
        <aside className={`${styles.drawer} ${styles.sidebar}`}>
          <div className={styles.drawerHeader}>
            <X size={20} color="white" onClick={onClose} className={styles.closeDrawer} />
          </div>
          <div className={styles.logo}>
            <TrendingUp size={24} color="#1D9E75" />
            <span>ZenTriq</span>
          </div>
          <nav className={styles.nav}>
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                onClick={onClose}
              >
                <link.icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className={styles.footer}>
            <div className={styles.user}>
              <div className={styles.avatar}>{initials}</div>
              <span className={styles.name}>{user?.name || 'Usuário'}</span>
            </div>
            <button className={styles.logoutBtn} onClick={logout}>
              <LogOut size={16} />
            </button>
          </div>
        </aside>
      </>
    );
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <TrendingUp size={24} color="#1D9E75" />
        <span>ZenTriq</span>
      </div>
      <nav className={styles.nav}>
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            <link.icon size={18} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className={styles.footer}>
        <div className={styles.user}>
          <div className={styles.avatar}>{initials}</div>
          <span className={styles.name}>{user?.name || 'Usuário'}</span>
        </div>
        <button className={styles.logoutBtn} onClick={logout}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
