import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Select } from '../ui/Select';
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
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const stored = localStorage.getItem('selectedMonth');
    return stored ? parseInt(stored) : now.getMonth() + 1;
  });

  const [selectedYear, setSelectedYear] = useState(() => {
    const stored = localStorage.getItem('selectedYear');
    return stored ? parseInt(stored) : now.getFullYear();
  });



  function handleMonthChange(value) {
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

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Menu">
          <Menu size={22} />
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.monthSelector}>
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
