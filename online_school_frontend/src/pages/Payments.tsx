import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { getMyPayments } from '../api/users';
import StatCard from '../components/shared/StatCard';

function Skeleton() {
  return (
    <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
    </div>
  );
}

function formatPrice(n: number) { return (n ?? 0).toLocaleString('fa-IR') + ' ت'; }

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  Successful: { cls: 'badge badge-success', label: 'موفق' },
  Pending:    { cls: 'badge badge-warning', label: 'در انتظار' },
  Failed:     { cls: 'badge badge-danger',  label: 'ناموفق' },
};

export default function Payments() {
  const { isAdmin } = useAuth();
  const { data: payments, loading, error, refetch } = useApi(() => getMyPayments(), []);

  const list = (payments as any[]) ?? [];
  const successTotal = list.filter(p => p.Status === 'Successful').reduce((s: number, p: any) => s + (p.Amount ?? 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">پرداخت‌ها</h1>
          <p className="page-subtitle">تاریخچه تراکنش‌های مالی</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 'var(--space-5)' }}>
        <StatCard title="جمع موفق" value={formatPrice(successTotal)} icon="💰" color="green" />
        <StatCard title="موفق" value={list.filter((p:any) => p.Status==='Successful').length} icon="✅" color="blue" />
        <StatCard title="ناموفق" value={list.filter((p:any) => p.Status==='Failed').length} icon="❌" color="rose" />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {loading ? 'در حال بارگذاری...' : `تراکنش‌ها (${list.length})`}
          </span>
        </div>

        {loading ? <Skeleton /> : error ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div><h3>{error}</h3>
            <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={refetch}>تلاش مجدد</button>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {isAdmin && <th>دانشجو</th>}
                  <th>دوره</th><th>مبلغ</th><th>تاریخ</th>
                  <th>شناسه تراکنش</th><th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">💳</div><h3>پرداختی ثبت نشده</h3></div></td></tr>
                ) : list.map((p: any, i: number) => (
                  <tr key={p.PaymentID ?? i}>
                    {isAdmin && <td style={{ fontWeight: 600 }}>{p.StudentName ?? p.StudentID}</td>}
                    <td style={{ color: 'var(--gray-600)' }}>{p.CourseTitle ?? p.CourseID}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{formatPrice(p.Amount)}</td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                      {p.PaymentDate ? new Date(p.PaymentDate).toLocaleDateString('fa-IR') : '—'}
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', direction: 'ltr', textAlign: 'right', color: 'var(--gray-400)' }}>
                      {p.TransactionID ?? '—'}
                    </td>
                    <td>
                      <span className={(STATUS_MAP[p.Status] ?? STATUS_MAP['Pending']).cls}>
                        {(STATUS_MAP[p.Status] ?? STATUS_MAP['Pending']).label}
                      </span>
                    </td>
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
