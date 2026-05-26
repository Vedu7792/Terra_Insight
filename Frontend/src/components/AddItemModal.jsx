import React, { useState, useEffect } from 'react';

const CATEGORIES = ['Electronics', 'Textiles', 'Chemicals', 'Furniture', 'Pharma'];
const REGIONS = ['North', 'South', 'East', 'West'];
const STATUSES = ['active', 'paused', 'discontinued'];

export default function AddItemModal({ isOpen, onClose, onSave }) {
  // Listen for Escape key to close the modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Form States
  const [item, setItem] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [region, setRegion] = useState(REGIONS[0]);
  const [target, setTarget] = useState('');
  const [status, setStatus] = useState(STATUSES[0]);
  const [weeklyDemand, setWeeklyDemand] = useState(Array(8).fill(''));

  // Error States
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleWeeklyChange = (idx, value) => {
    const updated = [...weeklyDemand];
    updated[idx] = value;
    setWeeklyDemand(updated);
  };

  const validate = () => {
    const newErrors = {};

    // 1. Validate Item Name
    if (!item.trim()) {
      newErrors.item = 'Item name is required';
    }

    // 2. Validate Target
    const targetNum = Number(target);
    if (!target) {
      newErrors.target = 'Target is required';
    } else if (isNaN(targetNum) || !Number.isInteger(targetNum) || targetNum <= 0) {
      newErrors.target = 'Target must be a positive integer';
    }

    // 3. Validate Weekly Demands
    const weeklyErrors = Array(8).fill('');
    let hasWeeklyError = false;

    weeklyDemand.forEach((val, idx) => {
      if (val === '') {
        weeklyErrors[idx] = 'Required';
        hasWeeklyError = true;
      } else {
        const valNum = Number(val);
        if (isNaN(valNum) || !Number.isInteger(valNum) || valNum < 0) {
          weeklyErrors[idx] = 'Must be ≥ 0';
          hasWeeklyError = true;
        }
      }
    });

    if (hasWeeklyError) {
      newErrors.weekly = weeklyErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return; // Stop if validation fails
    }

    // Form successfully validated, assemble item
    const newItem = {
      item: item.trim(),
      category,
      region,
      target: parseInt(target, 10),
      status,
      weekly_demand: weeklyDemand.map(val => parseInt(val, 10))
    };

    onSave(newItem);
    
    // Reset state after saving
    setItem('');
    setCategory(CATEGORIES[0]);
    setRegion(REGIONS[0]);
    setTarget('');
    setStatus(STATUSES[0]);
    setWeeklyDemand(Array(8).fill(''));
    setErrors({});
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Planning Item</h3>
          <button
            onClick={onClose}
            className="close-btn"
            aria-label="Close modal"
            title="Close modal (Esc)"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            
            {/* Item Name */}
            <div className="form-group-full">
              <label className="form-label" htmlFor="form-item-name">Item Name</label>
              <input
                id="form-item-name"
                type="text"
                className={`form-input ${errors.item ? 'error' : ''}`}
                placeholder="e.g. Display Panels, Base Compound"
                value={item}
                onChange={(e) => setItem(e.target.value)}
              />
              {errors.item && <span className="input-error-msg">{errors.item}</span>}
            </div>

            {/* Category Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="form-category">Category</label>
              <select
                id="form-category"
                className="select-control"
                style={{ minWidth: '100%' }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Region Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="form-region">Region</label>
              <select
                id="form-region"
                className="select-control"
                style={{ minWidth: '100%' }}
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                {REGIONS.map(reg => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>

            {/* Target Value */}
            <div className="form-group">
              <label className="form-label" htmlFor="form-target">Weekly Target</label>
              <input
                id="form-target"
                type="number"
                min="1"
                step="1"
                className={`form-input ${errors.target ? 'error' : ''}`}
                placeholder="Positive integer"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
              {errors.target && <span className="input-error-msg">{errors.target}</span>}
            </div>

            {/* Status Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="form-status">Initial Status</label>
              <select
                id="form-status"
                className="select-control"
                style={{ minWidth: '100%' }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUSES.map(stat => (
                  <option key={stat} value={stat}>{stat.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Weekly Demands Inputs (W1 - W8) */}
            <div className="form-demand-section">
              <div className="form-demand-label">Weekly Demand Quantities (W1 - W8)</div>
              <div className="form-demand-inputs">
                {Array(8).fill(null).map((_, idx) => {
                  const hasError = errors.weekly && errors.weekly[idx];
                  return (
                    <div key={idx} className="form-group" style={{ gap: '0.2rem' }}>
                      <label
                        className="form-label"
                        htmlFor={`form-w${idx + 1}`}
                        style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
                      >
                        W{idx + 1}
                      </label>
                      <input
                        id={`form-w${idx + 1}`}
                        type="number"
                        min="0"
                        step="1"
                        className={`form-input ${hasError ? 'error' : ''}`}
                        style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}
                        value={weeklyDemand[idx]}
                        onChange={(e) => handleWeeklyChange(idx, e.target.value)}
                      />
                      {hasError && (
                        <span className="input-error-msg" style={{ fontSize: '0.65rem', textAlign: 'center' }}>
                          {errors.weekly[idx]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              id="btn-cancel-add"
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              id="btn-submit-add"
              type="submit"
              className="btn btn-primary"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
