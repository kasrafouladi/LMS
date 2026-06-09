type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
}

const DOT_COLORS: Record<BadgeVariant, string> = {
  success: '#10b981',
  warning: '#f59e0b',
  danger:  '#ef4444',
  info:    '#3b82f6',
  neutral: '#94a3b8',
};

export default function Badge({ variant = 'neutral', children, dot }: BadgeProps) {
  return (
    <span className={`badge badge-${variant}`}>
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: DOT_COLORS[variant],
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────
export function enrollmentBadge(status: string) {
  const map: Record<string, BadgeVariant> = {
    Successful: 'success',
    Pending:    'warning',
    Failed:     'danger',
  };
  const labels: Record<string, string> = {
    Successful: 'موفق',
    Pending:    'در انتظار',
    Failed:     'ناموفق',
  };
  return <Badge variant={map[status] ?? 'neutral'} dot>{labels[status] ?? status}</Badge>;
}

export function paymentBadge(status: string) {
  return enrollmentBadge(status);
}

export function attendanceBadge(status: string) {
  const map: Record<string, BadgeVariant> = { Present: 'success', Absent: 'danger' };
  const labels: Record<string, string>    = { Present: 'حاضر',   Absent: 'غایب' };
  return <Badge variant={map[status] ?? 'neutral'} dot>{labels[status] ?? status}</Badge>;
}

export function userRoleBadge(role: string) {
  const map: Record<string, BadgeVariant> = { Admin: 'info', Teacher: 'violet' as BadgeVariant, Student: 'neutral' };
  const labels: Record<string, string>    = { Admin: 'مدیر', Teacher: 'مدرس', Student: 'دانشجو' };
  return <Badge variant={map[role] ?? 'neutral'}>{labels[role] ?? role}</Badge>;
}
