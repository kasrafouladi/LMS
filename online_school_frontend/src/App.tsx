import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import type { PageKey } from './components/layout/Sidebar';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Enrollments from './pages/Enrollments';
import Assignments from './pages/Assignments';
import Payments from './pages/Payments';
import Attendance from './pages/Attendance';
import Certificates from './pages/Certificates';
import Transcript from './pages/Transcript';
import Announcements from './pages/Announcements';
import Reports from './pages/Reports';
import { StudentsPage, TeachersPage } from './pages/StudentsTeachers';

function AppContent() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  function openCourse(id: number) {
    setSelectedCourseId(id);
    setActivePage('courses');
  }

  function navigateTo(page: PageKey) {
    if (page !== 'courses') setSelectedCourseId(null);
    setActivePage(page);
  }

  function renderPage() {
    switch (activePage) {
      case 'dashboard':    return <Dashboard onOpenCourse={openCourse} />;
      case 'users':        return <Users />;
      case 'students':     return <StudentsPage />;
      case 'teachers':     return <TeachersPage />;
      case 'courses':
        return selectedCourseId
          ? <CourseDetail courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />
          : <Courses onOpenCourse={openCourse} />;
      case 'enrollments':  return <Enrollments onOpenCourse={openCourse} />;
      case 'assignments':  return <Assignments onOpenCourse={openCourse} />;
      case 'payments':     return <Payments />;
      case 'attendance':   return <Attendance />;
      case 'certificates': return <Certificates onOpenCourse={openCourse} />;
      case 'transcript':   return <Transcript onOpenCourse={openCourse} />;
      case 'announcements':return <Announcements onOpenCourse={openCourse} />;
      case 'reports':      return <Reports onOpenCourse={openCourse} />;
      default:             return <Dashboard onOpenCourse={openCourse} />;
    }
  }

  return (
    <Layout activePage={activePage} onNavigate={navigateTo}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
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

  if (!user) {
    return authView === 'login'
      ? <LoginPage onShowRegister={() => setAuthView('register')} />
      : <RegisterPage
          onSuccess={() => setAuthView('login')}
          onBackToLogin={() => setAuthView('login')}
        />;
  }

  return <AppContent />;
}