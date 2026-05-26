import React, { useEffect } from 'react';

export default function DetailPanel({ item, onClose }) {
  // Listen for Escape key to close the panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  // Computations
  const totalDemand = item.weekly_demand.reduce((sum, val) => sum + val, 0);
  const averageDemand = Number((totalDemand / 8).toFixed(1));
  const zeroWeeksCount = item.weekly_demand.filter(val => val === 0).length;

  // Determine overall tracking status against weekly target
  const getOverallStatus = () => {
    const ratio = averageDemand / item.target;
    if (ratio >= 0.9) return { text: 'On Target', className: 'on-target' };
    if (ratio >= 0.5) return { text: 'At Risk', className: 'at-risk' };
    return { text: 'Below Target', className: 'below-target' };
  };

  const tracking = getOverallStatus();

  // SVG Sparkline Chart logic
  const minVal = 0;
  const maxVal = Math.max(...item.weekly_demand, item.target, 10); // scale against max value or target
  const chartHeight = 60;
  const chartWidth = 320;
  const paddingX = 15;
  const paddingY = 10;
  
  // Calculate SVG point coordinates
  const points = item.weekly_demand.map((val, idx) => {
    const x = paddingX + (idx * (chartWidth - 2 * paddingX)) / 7;
    // Scale y coordinates: 0 is at bottom (chartHeight - paddingY), maxVal is at top (paddingY)
    const usableHeight = chartHeight - 2 * paddingY;
    const y = chartHeight - paddingY - (val / maxVal) * usableHeight;
    return { x, y, val };
  });

  // SVG Path generation (straight lines)
  const pathD = points.reduce((path, p, idx) => {
    return path + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y} `;
  }, '');

  // Filled area path under the line
  const fillD = pathD + `L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  // Draw a horizontal line for the Target to visualize reference
  const targetY = chartHeight - paddingY - (item.target / maxVal) * (chartHeight - 2 * paddingY);

  return (
    <aside className="detail-panel" aria-label="Item details sidebar">
      <div className="detail-header">
        <div className="detail-title">
          <h2>{item.item}</h2>
          <p>{item.category} • {item.region} Region</p>
        </div>
        <button
          onClick={onClose}
          className="close-btn"
          aria-label="Close details"
          title="Close details (Esc)"
        >
          &times;
        </button>
      </div>

      {/* Meta grid */}
      <div className="detail-meta-grid">
        <div className="meta-item">
          <div className="meta-label">Overall Status</div>
          <div className={`meta-value meta-status-text ${tracking.className}`}>
            {/* Soft colored circle */}
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: tracking.className === 'on-target' ? 'var(--color-active)' : tracking.className === 'at-risk' ? 'var(--color-paused)' : 'var(--color-discontinued)'
            }}></span>
            {tracking.text}
          </div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Weekly Target</div>
          <div className="meta-value">{item.target} units</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Weekly Average</div>
          <div className="meta-value">{averageDemand} units</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Zero-Demand Weeks</div>
          <div className="meta-value" style={{ color: zeroWeeksCount > 0 ? '#f87171' : 'inherit' }}>
            {zeroWeeksCount} {zeroWeeksCount === 1 ? 'week' : 'weeks'}
          </div>
        </div>
      </div>

      {/* Sparkline trend chart */}
      <div className="trend-chart-box">
        <div className="meta-label" style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>Demand Trend (W1 - W8)</span>
          <span style={{ textTransform: 'none', color: 'var(--text-muted)' }}>Target: {item.target}</span>
        </div>
        <svg className="sparkline-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          <defs>
            <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Target Reference Line */}
          <line
            x1={0}
            y1={targetY}
            x2={chartWidth}
            y2={targetY}
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="4,4"
            opacity="0.6"
          />
          
          {/* Filled Area */}
          <path d={fillD} className="sparkline-fill" />
          
          {/* Trend Line */}
          <path d={pathD} className="sparkline-path" />
          
          {/* Data Points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="3.5"
              className="sparkline-dot"
            >
              <title>Week {idx + 1}: {p.val} units</title>
            </circle>
          ))}
        </svg>
      </div>

      {/* Weekly Breakdown List */}
      <div>
        <div className="weekly-list-title">Weekly Quantities</div>
        <div className="weekly-list">
          {item.weekly_demand.map((demand, idx) => {
            const isZero = demand === 0;
            const meetsTarget = demand >= item.target;
            return (
              <div key={idx} className="weekly-item-row">
                <span className="weekly-item-week">Week {idx + 1}</span>
                <span
                  className="weekly-item-val"
                  style={{
                    color: isZero
                      ? '#f87171'
                      : meetsTarget
                      ? 'var(--color-active)'
                      : demand < 0.5 * item.target
                      ? '#f87171'
                      : 'var(--color-paused)'
                  }}
                >
                  {demand} {isZero ? '(Zero)' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
