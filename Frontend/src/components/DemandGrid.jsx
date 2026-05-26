import React from 'react';

const WEEK_COLUMNS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];

export default function DemandGrid({
  items,
  selectedItemId,
  onRowClick,
  sortConfig,
  onSort
}) {
  // Get color coding class for weekly cells based on target
  const getCellColorClass = (value, target) => {
    if (value === 0 || value < 0.5 * target) {
      return 'red';
    } else if (value >= 0.9 * target) {
      return 'green';
    } else {
      return 'amber';
    }
  };

  // Render sorting indicator arrow
  const renderSortIndicator = (colKey) => {
    if (!sortConfig || sortConfig.key !== colKey) return null;
    return (
      <span className="sort-indicator">
        {sortConfig.direction === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  // Calculate dynamic weekly column totals for the summary row
  const calculateWeeklyTotals = () => {
    const totals = Array(8).fill(0);
    items.forEach(item => {
      item.weekly_demand.forEach((demand, idx) => {
        totals[idx] += demand;
      });
    });
    return totals;
  };

  // Calculate grand total of all visible items
  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => {
      const itemTotal = item.weekly_demand.reduce((t, v) => t + v, 0);
      return sum + itemTotal;
    }, 0);
  };

  const weeklyTotals = calculateWeeklyTotals();
  const grandTotal = calculateGrandTotal();

  return (
    <div className="grid-container">
      <div className="table-wrapper">
        <table className="demand-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Region</th>
              <th>Status</th>
              {WEEK_COLUMNS.map((week, idx) => {
                const colKey = `w${idx + 1}`;
                return (
                  <th
                    key={week}
                    className="sortable"
                    onClick={() => onSort(colKey, idx)}
                  >
                    {week} {renderSortIndicator(colKey)}
                  </th>
                );
              })}
              <th
                className="sortable"
                onClick={() => onSort('total', -1)}
                style={{ textAlign: 'right' }}
              >
                Total {renderSortIndicator('total')}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={13} style={{ padding: 0 }}>
                  <div className="empty-state">
                    {/* Circle info or face frown */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '3rem', height: '3rem' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.197 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                    </svg>
                    <h3>No items found</h3>
                    <p>Try adjusting your category or status filters, or reset them.</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map(item => {
                const itemTotal = item.weekly_demand.reduce((sum, val) => sum + val, 0);
                const isSelected = selectedItemId === item.id;
                return (
                  <tr
                    key={item.id}
                    className={isSelected ? 'selected' : ''}
                    onClick={() => onRowClick(item)}
                    id={`row-${item.id}`}
                  >
                    <td className="item-cell">{item.item}</td>
                    <td className="category-cell">{item.category}</td>
                    <td className="region-cell">{item.region}</td>
                    <td>
                      <span className={`status-badge ${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    {item.weekly_demand.map((demand, idx) => (
                      <td key={idx} style={{ padding: '0.4rem 0.5rem' }}>
                        <div className={`demand-cell ${getCellColorClass(demand, item.target)}`}>
                          {demand}
                        </div>
                      </td>
                    ))}
                    <td className="total-cell">{itemTotal}</td>
                  </tr>
                );
              })
            )}

            {/* Dynamic Summary Row */}
            {items.length > 0 && (
              <tr className="summary-row">
                <td colSpan={4}>Weekly Totals</td>
                {weeklyTotals.map((tot, idx) => (
                  <td key={idx} style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                    {tot}
                  </td>
                ))}
                <td style={{ textAlign: 'right', color: 'var(--text-primary)' }}>
                  {grandTotal}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
