interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; label: string };
}

export default function StatsCard({ title, value, subtitle, icon, color, trend }: StatsCardProps) {
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-300"
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid var(--border-color)",
        backdropFilter: "blur(10px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}33`;
        e.currentTarget.style.boxShadow = `0 8px 30px ${color}15`;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-color)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{
            background: `${color}18`,
            color: color,
          }}
        >
          {icon}
        </div>
        {trend && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-lg"
            style={{
              background: trend.value >= 0 ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
              color: trend.value >= 0 ? "#22c55e" : "#ef4444",
            }}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
      <div className="text-sm" style={{ color: "var(--text-muted)" }}>
        {title}
      </div>
      {subtitle && (
        <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
