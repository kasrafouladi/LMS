import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import type { PageKey } from './components/layout/Sidebar';
//import LoginPage from './pages/Login';

import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Courses from './pages/Courses';
import Enrollments from './pages/Enrollments';
import Assignments from './pages/Assignments';
import Payments from './pages/Payments';
import Attendance from './pages/Attendance';
import Certificates from './pages/Certificates';
import { StudentsPage, TeachersPage } from './pages/StudentsTeachers';

function AppContent() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');

  function renderPage() {
    switch (activePage) {
      case 'dashboard':    return <Dashboard />;
      case 'users':        return <Users />;
      case 'students':     return <StudentsPage />;
      case 'teachers':     return <TeachersPage />;
      case 'courses':      return <Courses />;
      case 'enrollments':  return <Enrollments />;
      case 'assignments':  return <Assignments />;
      case 'payments':     return <Payments />;
      case 'attendance':   return <Attendance />;
      case 'certificates': return <Certificates />;
      default:             return <Dashboard />;
    }
  }

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--gray-950)', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 20px #3b82f6)' }}>🎓</div>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  //if (!user) return <LoginPage />;

  return <AppContent />;
}
