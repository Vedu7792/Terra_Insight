import React from 'react';

const CATEGORIES = ['All', 'Electronics', 'Textiles', 'Chemicals', 'Furniture', 'Pharma'];
const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'discontinued', label: 'Discontinued' }
];

export default function Filters({
  category,
  setCategory,
  selectedStatuses,
  setSelectedStatuses,
  onReset
}) {
  const handleStatusChange = (statusValue) => {
    if (selectedStatuses.includes(statusValue)) {
      setSelectedStatuses(selectedStatuses.filter(s => s !== statusValue));
    } else {
      setSelectedStatuses([...selectedStatuses, statusValue]);
    }
  };

  return (
    <div className="controls-card">
      <div className="controls-grid">
        {/* Category Filter */}
        <div className="filter-group">
          <label htmlFor="category-select">Filter by Category</label>
          <select
            id="category-select"
            className="select-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <label>Filter by Status</label>
          <div className="status-filters">
            {STATUSES.map(stat => (
              <label key={stat.value} className="checkbox-label" htmlFor={`status-chk-${stat.value}`}>
                <input
                  id={`status-chk-${stat.value}`}
                  type="checkbox"
                  checked={selectedStatuses.includes(stat.value)}
                  onChange={() => handleStatusChange(stat.value)}
                />
                <span>{stat.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions (Reset Button) */}
        <div className="controls-actions">
          <button
            id="btn-reset-filters"
            className="btn btn-secondary"
            onClick={onReset}
            title="Reset all filters and sorting"
          >
            {/* ArrowPath/Reset icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '1.1rem', height: '1.1rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
