type DeveloperProgressRingProps = {
  percent: number;
  label?: string;
};

const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function DeveloperProgressRing({
  percent,
  label = "Developer Process completion",
}: DeveloperProgressRingProps) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  const dashOffset = RING_CIRCUMFERENCE - (safePercent / 100) * RING_CIRCUMFERENCE;

  return (
    <div
      className="developer-progress-ring"
      role="img"
      aria-label={`${label}: ${safePercent}% complete`}
    >
      <svg
        className="developer-progress-ring-graphic"
        viewBox="0 0 112 112"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="developer-progress-ring-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="var(--coral)" />
            <stop offset="50%" stopColor="var(--gold)" />
            <stop offset="100%" stopColor="var(--sky)" />
          </linearGradient>
        </defs>
        <circle
          className="developer-progress-ring-track"
          cx="56"
          cy="56"
          r={RING_RADIUS}
        />
        <circle
          className="developer-progress-ring-fill"
          cx="56"
          cy="56"
          r={RING_RADIUS}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="developer-progress-ring-center">
        <strong>{safePercent}%</strong>
      </div>
    </div>
  );
}
