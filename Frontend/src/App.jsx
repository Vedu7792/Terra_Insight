import React, { useState, useEffect } from 'react';
import Filters from './components/Filters';
import DemandGrid from './components/DemandGrid';
import DetailPanel from './components/DetailPanel';
import AddItemModal from './components/AddItemModal';

// Initial dataset from specification document
const INITIAL_DATA = [
  { "id": 1, "category": "Electronics", "region": "North",
    "item": "Display Panels",
    "weekly_demand": [120, 135, 98, 150, 160, 142, 130, 155],
    "target": 140, "status": "active" },
  { "id": 2, "category": "Textiles", "region": "South",
    "item": "Woven Fabric",
    "weekly_demand": [80, 75, 90, 85, 70, 88, 92, 78],
    "target": 85, "status": "active" },
  { "id": 3, "category": "Chemicals", "region": "East",
    "item": "Solvent A",
    "weekly_demand": [40, 38, 0, 42, 45, 0, 39, 41],
    "target": 40, "status": "paused" },
  { "id": 4, "category": "Furniture", "region": "West",
    "item": "Chair Frames",
    "weekly_demand": [200, 195, 210, 190, 205, 215, 200, 198],
    "target": 200, "status": "active" },
  { "id": 5, "category": "Pharma", "region": "North",
    "item": "Base Compound X",
    "weekly_demand": [55, 60, 58, 62, 57, 61, 59, 63],
    "target": 60, "status": "active" },
  { "id": 6, "category": "Electronics", "region": "South",
    "item": "Sensor Modules",
    "weekly_demand": [300, 310, 290, 320, 315, 300, 325, 310],
    "target": 310, "status": "active" },
  { "id": 7, "category": "Textiles", "region": "West",
    "item": "Knit Rolls",
    "weekly_demand": [65, 0, 0, 70, 68, 0, 72, 66],
    "target": 68, "status": "paused" },
  { "id": 8, "category": "Chemicals", "region": "North",
    "item": "Reagent B",
    "weekly_demand": [22, 25, 23, 0, 0, 0, 0, 0],
    "target": 22, "status": "discontinued" },
  { "id": 9, "category": "Furniture", "region": "East",
    "item": "Table Tops",
    "weekly_demand": [88, 92, 90, 95, 89, 93, 91, 94],
    "target": 90, "status": "active" },
  { "id": 10, "category": "Pharma", "region": "South",
    "item": "Tablet Binder",
    "weekly_demand": [110, 108, 115, 112, 109, 114, 111, 113],
    "target": 112, "status": "active" }
];

export default function App() {
  // 1. Data Store State with LocalStorage sync
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('demand_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed parsing demand_data from localStorage", e);
      }
    }
    return INITIAL_DATA;
  });

  // Sync to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('demand_data', JSON.stringify(items));
  }, [items]);

  // 2. Filter States
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState(['active', 'paused', 'discontinued']);

  // 3. Sorting State
  // sortConfig format: { key: 'w1' | 'w2' | ... | 'w8' | 'total', direction: 'asc' | 'desc', weekIndex: number }
  const [sortConfig, setSortConfig] = useState(null);

  // 4. Detail Panel State
  const [selectedItem, setSelectedItem] = useState(null);

  // 5. Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Reset all filters and sorting
  const handleResetFilters = () => {
    setCategoryFilter('All');
    setStatusFilter(['active', 'paused', 'discontinued']);
    setSortConfig(null);
  };

  // Trigger sorting on column header click
  const handleSort = (colKey, weekIdx) => {
    let direction = 'desc'; // Default to desc (higher values first is more useful for planners)
    if (sortConfig && sortConfig.key === colKey) {
      direction = sortConfig.direction === 'desc' ? 'asc' : 'desc';
    }
    setSortConfig({ key: colKey, direction, weekIndex: weekIdx });
  };

  // Add a new item from the modal
  const handleAddItem = (newItemData) => {
    // Generate next unique ID
    const nextId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    const itemToAdd = {
      id: nextId,
      ...newItemData
    };

    setItems([...items, itemToAdd]);
    setIsModalOpen(false);

    // Auto-select the newly added item to display in the side panel
    setSelectedItem(itemToAdd);
  };

  // Filtering Logic
  const filteredItems = items.filter(item => {
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesStatus = statusFilter.includes(item.status);
    return matchesCategory && matchesStatus;
  });

  // Sorting Logic applied to filtered items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortConfig) return 0; // No sort active, maintain natural order

    const { key, direction, weekIndex } = sortConfig;

    let valA = 0;
    let valB = 0;

    if (key === 'total') {
      // Calculate sums
      valA = a.weekly_demand.reduce((sum, v) => sum + v, 0);
      valB = b.weekly_demand.reduce((sum, v) => sum + v, 0);
    } else {
      // It is a weekly column W1 - W8
      valA = a.weekly_demand[weekIndex];
      valB = b.weekly_demand[weekIndex];
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Safe detail panel synchronization: 
  // If the currently selected item is deleted/modified, keep track of it
  const currentDetailItem = selectedItem
    ? items.find(i => i.id === selectedItem.id) || null
    : null;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-title-area">
          <h1>Weekly Demand Grid</h1>
          <p>Interactive operational planning dashboard for inventory forecasting</p>
        </div>
        <div>
          <button
            id="btn-add-item-trigger"
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            {/* Plus Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '1.1rem', height: '1.1rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Item
          </button>
        </div>
      </header>

      {/* Filters controls */}
      <Filters
        category={categoryFilter}
        setCategory={setCategoryFilter}
        selectedStatuses={statusFilter}
        setSelectedStatuses={setStatusFilter}
        onReset={handleResetFilters}
      />

      {/* Dashboard Grid and Panel layout */}
      <main className="dashboard-layout">
        {/* The Grid Table */}
        <DemandGrid
          items={sortedItems}
          selectedItemId={currentDetailItem?.id}
          onRowClick={(item) => setSelectedItem(item)}
          sortConfig={sortConfig}
          onSort={handleSort}
        />

        {/* Side Detail Panel */}
        {currentDetailItem && (
          <DetailPanel
            item={currentDetailItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </main>

      {/* Add Item Modal Dialog */}
      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddItem}
      />
    </div>
  );
}
