interface Props {
  icon: string;
  label: string;
  value: string | number;
}

export default function MetricCard({ icon, label, value }: Props) {
  return (
    <div className="metric-card">
      <div className="metric-label">
        <i className={`ti ${icon}`} aria-hidden="true" />
        {label}
      </div>
      <div className="metric-value">
        {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
      </div>
    </div>
  );
}