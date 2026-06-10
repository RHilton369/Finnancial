import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, Bell } from 'lucide-react';
import { Select } from '../ui/Select';
import { useTheme } from '../../context/ThemeContext';
import { notificationsApi } from '../../api/notifications';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './TopBar.module.css';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transações',
  '/subscriptions': 'Assinaturas',
  '/budgets': 'Orçamentos',
  '/goals': 'Metas',
  '/reports': 'Relatórios',
  '/settings': 'Configurações',
  '/investments': 'Investimentos',
  '/chat': 'Assistente IA',
};

export function TopBar({ onMenuClick }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'ZenTriq';
  const { theme, toggleTheme } = useTheme();

  const now = new Date();
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const stored = localStorage.getItem('selectedMonth');
    return stored ? parseInt(stored) : now.getMonth() + 1;
  });

  const [selectedYear, setSelectedYear] = useState(() => {
    const stored = localStorage.getItem('selectedYear');
    return stored ? parseInt(stored) : now.getFullYear();
  });

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        await notificationsApi.sync(); // Gera novas se houver
        const res = await notificationsApi.list();
        setNotifications(res.data);
      } catch (err) {
        console.error('Erro ao buscar notificações', err);
      }
    };
    fetchNotifications();
    
    // Intervalo básico para atualizar a cada 5 minutos
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {}
  };  function handleMonthChange(value) {
    const month = parseInt(value);
    setSelectedMonth(month);
    localStorage.setItem('selectedMonth', value);
    window.dispatchEvent(new CustomEvent('monthChange', { detail: { month, year: selectedYear } }));
  }

  function handleYearChange(value) {
    const year = parseInt(value);
    setSelectedYear(year);
    localStorage.setItem('selectedYear', value);
    window.dispatchEvent(new CustomEvent('monthChange', { detail: { month: selectedMonth, year } }));
  }

  const monthOptions = MONTHS.map((m, i) => ({ value: i + 1, label: m }));
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = now.getFullYear() - 2 + i;
    return { value: y, label: y.toString() };
  });

  const formatNotificationDate = (dateStr) => {
    if (!dateStr || dateStr.includes('datetime')) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return format(d, "dd/MM 'às' HH:mm", { locale: ptBR });
    } catch (err) {
      return '';
    }
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Menu">
          <Menu size={22} />
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.monthSelector}>
        <div className={styles.bellWrap}>
          <button 
            className={styles.bellBtn} 
            onClick={() => setShowDropdown(!showDropdown)}
            title="Notificações"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          
          {showDropdown && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownTitle}>Notificações</span>
                {unreadCount > 0 && (
                  <button className={styles.markAllBtn} onClick={handleMarkAllAsRead}>
                    Marcar todas lidas
                  </button>
                )}
              </div>
              <div className={styles.dropdownList}>
                {notifications.length === 0 ? (
                  <div className={styles.emptyNotif}>Sem notificações por enquanto.</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`${styles.notificationItem} ${n.is_read === 0 ? styles.unread : ''}`}
                      onClick={() => {
                        if (n.is_read === 0) handleMarkAsRead(n.id);
                      }}
                    >
                      <div className={styles.notifTitle}>{n.title}</div>
                      <div className={styles.notifMessage}>{n.message}</div>
                      <span className={styles.notifDate}>
                        {formatNotificationDate(n.created_at)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={toggleTheme}
          style={{ 
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center',
            marginRight: '8px'
          }}
          title={theme === 'dark' ? 'Mudar para Claro' : 'Mudar para Escuro'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <Select
          value={selectedMonth}
          onChange={handleMonthChange}
          options={monthOptions}
          minWidth="130px"
        />
        <Select
          value={selectedYear}
          onChange={handleYearChange}
          options={yearOptions}
          minWidth="100px"
        />
      </div>
    </header>
  );
}
