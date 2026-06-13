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
  | 'inactive-students' | 'failed-payments' | 'course-grades' | 'monthly-income'
  | 'teacher-ranking';

function fmtDate(d?: string | null) { return d ? new Date(d).toLocaleDateString('fa-IR') : '—'; }
function fmtMoney(n?: number) { return (n ?? 0).toLocaleString('fa-IR') + ' ت'; }

const todayISO = () => new Date().toISOString().slice(0, 10);
const yearAgoISO = () => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().slice(0, 10); };

interface ReportsProps {
  onOpenCourse?: (courseId: number) => void;
}

export default function Reports({ onOpenCourse }: ReportsProps) {
  const { isAdmin, isTeacher } = useAuth();

  const REPORTS: { key: ReportKey; label: string; roles: ('Admin'|'Teacher'|'Student')[] }[] = [
    { key: 'popular-courses',   label: 'پرطرفدارترین دوره‌ها',   roles: ['Admin', 'Teacher', 'Student'] },
    { key: 'top-students',      label: 'برترین دانشجویان',       roles: ['Admin', 'Teacher', 'Student'] },
    { key: 'course-grades',     label: 'آمار نمرات دوره',         roles: ['Admin', 'Teacher', 'Student'] },
    { key: 'course-enrollments',label: 'آمار ثبت‌نام دوره‌ها',     roles: ['Admin', 'Teacher'] },
    { key: 'teacher-income',    label: 'درآمد مدرسان',           roles: ['Admin', 'Teacher'] },
    { key: 'teacher-ranking',   label: 'رتبه‌بندی مدرسان',        roles: ['Admin'] },
    { key: 'inactive-students', label: 'دانشجویان غیرفعال',      roles: ['Admin'] },
    { key: 'failed-payments',   label: 'پرداخت‌های ناموفق',       roles: ['Admin'] },
    { key: 'monthly-income',    label: 'درآمد ماهانه',           roles: ['Admin'] },
  ];

  const myRole: 'Admin' | 'Teacher' | 'Student' = isAdmin ? 'Admin' : isTeacher ? 'Teacher' : 'Student';
  const visibleReports = REPORTS.filter(r => r.roles.includes(myRole));

  const [active, setActive] = useState<ReportKey>(visibleReports[0]?.key ?? 'popular-courses');

  const [startDate, setStartDate] = useState(yearAgoISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [topN, setTopN] = useState(10);
  const [days, setDays] = useState(60);
  const [year, setYear] = useState(new Date().getFullYear());
  const [basis, setBasis] = useState('Income');
  const [courseId, setCourseId] = useState<number | ''>('');

  const { data, loading, error } = useApi(() => {
    switch (active) {
      case 'top-students': return reportTopStudents(topN);
      case 'teacher-income': return reportTeacherIncome(startDate, endDate);
      case 'popular-courses': return reportPopularCourses();
      case 'course-enrollments': return reportCourseEnrollments();
      case 'inactive-students': return reportInactiveStudents(days);
      case 'failed-payments': return reportFailedPayments(startDate, endDate);
      case 'course-grades': return reportCourseGrades(courseId === '' ? undefined : courseId);
      case 'monthly-income': return reportMonthlyIncome(year);
      case 'teacher-ranking': return reportTeacherRanking(basis);
      default: return Promise.resolve([]);
    }
  }, [active, startDate, endDate, topN, days, year, basis, courseId]);

  const list = (data as any[]) ?? [];

  const showsParams = ['top-students','course-grades','teacher-income','failed-payments','inactive-students','monthly-income','teacher-ranking'].includes(active);

  // تابع کمکی برای فیلتر کردن کلیدهای ناخواسته (مثلاً MEDIAN Score)
  const isKeyToExclude = (key: string): boolean => {
    return /median/i.test(key); // حذف هر کلیدی که شامل "median" باشد (بدون توجه به حروف بزرگ/کوچک)
  };

  // اگر لیست خالی نباشد، کلیدهای مجاز را استخراج می‌کنیم
  const allowedKeys = list.length > 0 ? Object.keys(list[0]).filter(key => !isKeyToExclude(key)) : [];

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

      <div className="card" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {active === 'top-students' && (
            <div className="form-group">
              <label className="form-label">تعداد</label>
              <input className="form-input" type="number" min={1} max={50} value={topN} onChange={e => setTopN(+e.target.value)} dir="ltr" style={{ width: 100 }} />
            </div>
          )}
          {active === 'course-grades' && (
            <div className="form-group">
              <label className="form-label">شناسه دوره (اختیاری)</label>
              <input className="form-input" type="number" value={courseId} onChange={e => setCourseId(e.target.value ? +e.target.value : '')} dir="ltr" style={{ width: 140 }} placeholder="همه دوره‌ها" />
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
          {!showsParams && (
            <p style={{ color: 'var(--gray-400)', fontSize: 'var(--text-sm)' }}>این گزارش بدون پارامتر اضافی نمایش داده می‌شود.</p>
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
                  {allowedKeys.map(key => <th key={key}>{key}</th>)}
                </tr>
              </thead>
              <tbody>
                {list.map((row: any, i: number) => (
                  <tr 
                    key={i}
                    style={{ cursor: onOpenCourse && row.CourseID ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (onOpenCourse && row.CourseID) onOpenCourse(row.CourseID);
                    }}
                  >
                    {allowedKeys.map(key => {
                      const val = row[key];
                      return (
                        <td key={key}>
                          {typeof val === 'number' && /amount|income|score|gpa/i.test(key)
                            ? (key.toLowerCase().includes('amount') || key.toLowerCase().includes('income') 
                                ? fmtMoney(val as number) 
                                : <span style={{ fontFamily: 'monospace', direction: 'ltr' }}>{(val as number).toFixed(2)}</span>)
                            : /date/i.test(key) && typeof val === 'string'
                              ? fmtDate(val)
                              : (val == null ? '—' : String(val))}
                        </td>
                      );
                    })}
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