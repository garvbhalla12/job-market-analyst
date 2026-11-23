import Card from '../common/Card';
import { EmptyState, ErrorState, Skeleton } from '../common/States';

// Card wrapper that handles loading / error / empty states for any chart placed inside.
export default function ChartCard({
  title,
  subtitle,
  action,
  loading,
  error,
  onRetry,
  empty,
  height = 300,
  emptyText = 'No data available.',
  className = '',
  children,
}) {
  let body;
  if (error) {
    body = <ErrorState message={error} onRetry={onRetry} compact />;
  } else if (loading) {
    body = (
      <div style={{ height }}>
        <Skeleton className="h-full w-full" />
      </div>
    );
  } else if (empty) {
    body = <EmptyState title={emptyText} />;
  } else {
    body = children;
  }

  return (
    <Card title={title} subtitle={subtitle} action={action} className={className}>
      {body}
    </Card>
  );
}
