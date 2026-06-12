import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCourseAnnouncements } from '../api/index';
import { listCourses } from '../api/courses';
import { getStudentTranscript } from '../api/index';
import { useApi } from '../hooks/useApi';

function fmtDate(d?: string | null) { return d ? new Date(d).toLocaleDateString('fa-IR') : '—'; }

export default function Announcements() {
  const { isStudent, isTeacher, isAdmin, user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine relevant course list per role
  const { data: allCourses } = useApi(() => listCourses(), []);
  const { data: transcript } = useApi(() => isStudent ? getStudentTranscript() : Promise.resolve([]), [isStudent]);

  useEffect(() => {
    let courseIds: { id: number; title: string }[] = [];

    if (isStudent) {
      const enrolled = ((transcript as any[]) ?? []).filter((e: any) => e.EnrollmentStatus === 'Successful');
      courseIds = enrolled.map((e: any) => ({ id: e.CourseID, title: e.CourseTitle }));
    } else if (isTeacher) {
      const mine = ((allCourses as any[]) ?? []).filter((c: any) => c.TeacherID === Number(user?.sub));
      courseIds = mine.map((c: any) => ({ id: c.CourseID, title: c.Title }));
    } else if (isAdmin) {
      courseIds = ((allCourses as any[]) ?? []).map((c: any) => ({ id: c.CourseID, title: c.Title }));
    }

    if (courseIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      courseIds.map(c =>
        getCourseAnnouncements(c.id)
          .then((anns: any[]) => anns.map(a => ({ ...a, _courseTitle: c.title })))
          .catch(() => [])
      )
    ).then(results => {
      const flat = results.flat().sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime());
      setItems(flat);
      setLoading(false);
    });
  }, [isStudent, isTeacher, isAdmin, allCourses, transcript, user]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">اطلاعیه‌ها</h1>
          <p className="page-subtitle">آخرین اطلاعیه‌های دوره‌های شما</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">{loading ? 'در حال بارگذاری...' : `اطلاعیه‌ها (${items.length})`}</span>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {loading ? (
            [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 70, borderRadius: 8 }} />)
          ) : items.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📢</div><h3>اطلاعیه‌ای موجود نیست</h3></div>
          ) : items.map((a: any) => (
            <div key={`${a.AnnouncementID}-${a._courseTitle}`} style={{ padding: 'var(--space-4)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700 }}>{a.Title}</div>
                <span className="badge badge-info">{a._courseTitle}</span>
              </div>
              <div style={{ color: 'var(--gray-600)', fontSize: 'var(--text-sm)', marginTop: 6 }}>{a.Content}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginTop: 8 }}>{fmtDate(a.CreatedAt)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}