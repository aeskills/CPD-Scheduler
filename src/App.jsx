import React, { useState, useEffect } from 'react';
import SchedulerPage from './pages/SchedulerPage';
import AdminPage from './pages/AdminPage';
import './styles/index.css';

export default function App() {
  const [route, setRoute] = useState(() => {
    if (typeof window === 'undefined') return 'scheduler';
    const path = window.location.pathname.toLowerCase();
    if (path.includes('admin')) return 'admin';
    return 'scheduler';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('admin')) setRoute('admin');
      else setRoute('scheduler');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (route === 'admin') {
    return <AdminPage />;
  }

  return <SchedulerPage />;
}
