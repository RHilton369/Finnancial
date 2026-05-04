import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import styles from './TopBar.module.css';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transações',
  '/budgets': 'Orçamentos',
  '/goals': 'Metas',
  '/reports': 'Relatórios',
  '/settings': 'Configurações',
};

export function TopBar({ onMenuClick }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Finnancial';

  const now = new Date();
  const storedMonth = localStorage.getItem('selectedMonth');
  const storedYear = localStorage.getItem('selectedYear');
  const initialMonth = storedMonth ? parseInt(storedMonth) : now.getMonth() + 1;
  const initialYear = storedYear ? parseInt(storedYear) : now.getFullYear();

  function handleMonthChange(value) {
    localStorage.setItem('selectedMonth', value);
    window.dispatchEvent(new CustomEvent('monthChange', { detail: { month: parseInt(value), year: parseInt(localStorage.getItem('selectedYear') || now.getFullYear()) } }));
  }

  function handleYearChange(value) {
    localStorage.setItem('selectedYear', value);
    window.dispatchEvent(new CustomEvent('monthChange', { detail: { month: parseInt(localStorage.getItem('selectedMonth') || now.getMonth() + 1), year: parseInt(value) } }));
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Menu">
          <Menu size={22} />
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.monthSelector}>
        <select value={initialMonth} onChange={e => handleMonthChange(e.target.value)}>
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select value={initialYear} onChange={e => handleYearChange(e.target.value)}>
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </header>
  );
}
