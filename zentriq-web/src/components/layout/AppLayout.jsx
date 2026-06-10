import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import styles from './Layout.module.css';
import UpdateNotifier from '../UpdateNotifier';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.appLayout}>
      {/* Desktop sidebar */}
      <div className={styles.desktopSidebar}>
        <Sidebar />
      </div>
      {/* Mobile drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        mobile
      />
      <div className={styles.main}>
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className={styles.content}>
          <div className={styles.pageContainer}>
            <Outlet />
          </div>
        </main>
      </div>
      <UpdateNotifier />
    </div>
  );
}
