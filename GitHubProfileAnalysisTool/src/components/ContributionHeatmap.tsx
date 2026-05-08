import type { ContributionWeek } from '../types/github';

interface Props {
  weeks: ContributionWeek[];
  totalContributions: number;
}

const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const DAY_LABELS = ['', 'Pzt', '', 'Çar', '', 'Cum', ''];

const COLORS_LIGHT = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
const COLORS_DARK  = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

export default function ContributionHeatmap({ weeks, totalContributions }: Props) {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const colors = isDark ? COLORS_DARK : COLORS_LIGHT;

  const CELL = 13;
  const GAP = 3;
  const STEP = CELL + GAP;
  const TOP_PAD = 22;
  const LEFT_PAD = 30;

  const svgWidth = LEFT_PAD + weeks.length * STEP;
  const svgHeight = TOP_PAD + 7 * STEP;

  const monthLabels: { label: string; x: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const first = week.days[0];
    if (!first) return;
    const m = new Date(first.date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ label: MONTHS[m], x: LEFT_PAD + wi * STEP });
      lastMonth = m;
    }
  });

  return (
    <div className="heatmap-card">
      <div className="heatmap-header">
        <span className="section-title">Katkı aktivitesi</span>
        <span className="heatmap-total">
          {totalContributions.toLocaleString('tr-TR')} katkı (son 1 yıl)
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg
          width={svgWidth}
          height={svgHeight}
          role="img"
          aria-label={`${totalContributions} katkılık aktivite haritası`}
        >
          {monthLabels.map(({ label, x }) => (
            <text
              key={`${label}-${x}`}
              x={x}
              y={14}
              fontSize={10}
              fill={isDark ? '#8b949e' : '#57606a'}
            >
              {label}
            </text>
          ))}

          {DAY_LABELS.map((d, i) =>
            d ? (
              <text
                key={i}
                x={0}
                y={TOP_PAD + i * STEP + CELL - 2}
                fontSize={10}
                fill={isDark ? '#8b949e' : '#57606a'}
              >
                {d}
              </text>
            ) : null
          )}

          {weeks.map((week, wi) =>
            week.days.map((day) => {
              const dow = new Date(day.date).getDay();
              const row = dow === 0 ? 6 : dow - 1;
              return (
                <rect
                  key={day.date}
                  x={LEFT_PAD + wi * STEP}
                  y={TOP_PAD + row * STEP}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={colors[day.level]}
                >
                  <title>{`${day.date}: ${day.count} katkı`}</title>
                </rect>
              );
            })
          )}
        </svg>
      </div>

      <div className="heatmap-legend">
        <span>Az</span>
        {colors.map((c, i) => (
          <span
            key={i}
            style={{ width: 11, height: 11, borderRadius: 2, background: c, display: 'inline-block' }}
          />
        ))}
        <span>Çok</span>
      </div>
    </div>
  );
}