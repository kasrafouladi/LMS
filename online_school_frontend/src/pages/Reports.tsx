import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import {
  reportTopStudents, reportTeacherIncome, reportPopularCourses, reportCourseEnrollments,
  reportInactiveStudents, reportFailedPayments, reportCourseGrades, reportMonthlyIncome,
  reportTeacherRanking
} from '../api/index';

type ReportKey =
  | 'top-students' | 'teacher-income' | 'popular-courses' | 'course-enrollments'
  | 'inactive-students' | 'failed-payments' | 'course-grades' | 'monthly-income' | 'teacher-ranking';

function fmtDate(d?: string | null) { return d ? new Date(d).toLocaleDateString('fa-IR') : '—'; }
function fmtMoney(n?: number) { return (n ?? 0).toLocaleString('fa-IR') + ' ت'; }

const todayISO = () => new Date().toISOString().slice(0, 10);
const yearAgoISO = () => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().slice(0, 10); };

export default function Reports() {
  const { isAdmin, isTeacher } = useAuth();
  const [active, setActive] = useState<ReportKey>('popular-courses');

  // shared params
  const [startDate, setStartDate] = useState(yearAgoISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [topN, setTopN] = useState(10);
  const [days, setDays] = useState(60);
  const [year, setYear] = useState(new Date().getFullYear());
  const [basis, setBasis] = useState('Income');

  const REPORTS: { key: ReportKey; label: string; roles: ('Admin'|'Teacher')[] }[] = [
    { key: 'popular-courses', label: 'پرطرفدارترین دوره‌ها', roles: ['Admin', 'Teacher'] },
    { key: 'top-students', label: 'برترین دانشجویان', roles: ['Admin', 'Teacher'] },
    { key: 'course-enrollments', label: 'آمار ثبت‌نام دوره‌ها', roles: ['Admin', 'Teacher'] },
    { key: 'course-grades', label: 'آمار نمرات دوره', roles: ['Admin', 'Teacher'] },
    { key: 'teacher-income', label: 'درآمد مدرسان', roles: ['Admin', 'Teacher'] },
    { key: 'teacher-ranking', label: 'رتبه‌بندی مدرسان', roles: ['Admin'] },
    { key: 'inactive-students', label: 'دانشجویان غیرفعال', roles: ['Admin'] },
    { key: 'failed-payments', label: 'پرداخت‌های ناموفق', roles: ['Admin'] },
    { key: 'monthly-income', label: 'درآمد ماهانه', roles: ['Admin'] },
  ];

  const visibleReports = REPORTS.filter(r => (isAdmin ? r.roles.includes('Admin') : r.roles.includes('Teacher')));

  // Fetch data based on active report
  const { data, loading, error } = useApi(() => {
    switch (active) {
      case 'top-students': return reportTopStudents(topN);
      case 'teacher-income': return reportTeacherIncome(startDate, endDate);
      case 'popular-courses': return reportPopularCourses();
      case 'course-enrollments': return reportCourseEnrollments();
      case 'inactive-students': return reportInactiveStudents(days);
      case 'failed-payments': return reportFailedPayments(startDate, endDate);
      case 'course-grades': return reportCourseGrades();
      case 'monthly-income': return reportMonthlyIncome(year);
      case 'teacher-ranking': return reportTeacherRanking(basis);
      default: return Promise.resolve([]);
    }
  }, [active, startDate, endDate, topN, days, year, basis]);

  const list = (data as any[]) ?? [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">گزارش‌ها</h1>
          <p className="page-subtitle">گزارش‌های تحلیلی سیستم</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        {visibleReports.map(r => (
          <button key={r.key} className={`btn ${active === r.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActive(r.key)}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Parameter controls */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {active === 'top-students' && (
            <div className="form-group">
              <label className="form-label">تعداد</label>
              <input className="form-input" type="number" min={1} max={50} value={topN} onChange={e => setTopN(+e.target.value)} dir="ltr" style={{ width: 100 }} />
            </div>
          )}
          {(active === 'teacher-income' || active === 'failed-payments') && (
            <>
              <div className="form-group">
                <label className="form-label">از تاریخ</label>
                <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} dir="ltr" />
              </div>
              <div className="form-group">
                <label className="form-label">تا تاریخ</label>
                <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} dir="ltr" />
              </div>
            </>
          )}
          {active === 'inactive-students' && (
            <div className="form-group">
              <label className="form-label">روزهای عدم فعالیت</label>
              <input className="form-input" type="number" min={1} value={days} onChange={e => setDays(+e.target.value)} dir="ltr" style={{ width: 120 }} />
            </div>
          )}
          {active === 'monthly-income' && (
            <div className="form-group">
              <label className="form-label">سال</label>
              <input className="form-input" type="number" value={year} onChange={e => setYear(+e.target.value)} dir="ltr" style={{ width: 120 }} />
            </div>
          )}
          {active === 'teacher-ranking' && (
            <div className="form-group">
              <label className="form-label">معیار</label>
              <select className="form-select" value={basis} onChange={e => setBasis(e.target.value)} style={{ width: 160 }}>
                <option value="Income">درآمد</option>
                <option value="Grades">نمرات</option>
                <option value="Courses">تعداد دوره‌ها</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">{loading ? 'در حال بارگذاری...' : `نتایج (${list.length})`}</span>
        </div>
        {loading ? (
          <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
          </div>
        ) : error ? (
          <div className="empty-state"><div className="empty-icon">⚠️</div><h3>{error}</h3></div>
        ) : list.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📈</div><h3>داده‌ای موجود نیست</h3></div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {Object.keys(list[0]).map(key => <th key={key}>{key}</th>)}
                </tr>
              </thead>
              <tbody>
                {list.map((row: any, i: number) => (
                  <tr key={i}>
                    {Object.entries(row).map(([key, val], j) => (
                      <td key={j}>
                        {typeof val === 'number' && /amount|income|score|gpa/i.test(key)
                          ? (key.toLowerCase().includes('amount') || key.toLowerCase().includes('income') ? fmtMoney(val as number) : (val as number))
                          : /date/i.test(key) && typeof val === 'string'
                            ? fmtDate(val)
                            : (val == null ? '—' : String(val))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}