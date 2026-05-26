# Weekly Demand Grid - Interactive Planning Dashboard

### Submitted by:
* **Name**: Vedant Telsinge
* **Role**: Frontend Engineer Intern Candidate
* **Time Spent**: ~6 hours

---

## Project Overview

This is an interactive demand planning dashboard designed for operational planners to track, analyze, and manage weekly demand quantities across product categories and source regions. The dashboard highlights inventory demand health metrics, allows detailed analysis of individual items, and supports dynamic updates through a validated new item form.

The project is structured with a simple, readable, and well-commented codebase in **React** and **custom CSS**, mimicking a high-quality internship project.

---

## Implemented Features

### 1. Core Data Grid
* Renders all 10 product items with columns for metadata, weekly demands (W1-W8), and automatic total calculations.
* **Weekly Cell Color-Coding (Heatmap)** based on the item's target demand:
  * 🟢 **Green**: Demand is $\ge 90\%$ of the target.
  * 🟡 **Amber**: Demand is between $50\%$ and $89\%$ of the target.
  * 🔴 **Red**: Demand is $< 50\%$ of the target or zero ($0$).
* **Status Badges**: Soft styled pills corresponding to item states (`active`, `paused`, `discontinued`).
* **Dynamic Summary Row**: Updates real-time totals for each week and grand total based on current active filters.

### 2. Filtering & Sorting
* **Category Dropdown Filter**: Filters items to show specific categories (`Electronics`, `Textiles`, `Chemicals`, `Furniture`, `Pharma`).
* **Multi-Select Status Filter**: Live checkboxes to show/hide items with active, paused, or discontinued statuses.
* **Bidirectional Sorting**: Sort columns ascending/descending by clicking on any week header (`W1` through `W8`) or the `Total` column. Features visual sort indicators (`▲` / `▼`).
* **Reset Button**: Single-click button (`Reset Filters`) to clear all active filters and sort states.

### 3. Sidebar Detail Panel
* Clicking any row slides in a clean detail panel containing computed item insights:
  * All 8 weekly demand values.
  * Visual target tracking status (`On Target`, `At Risk`, `Below Target`).
  * Calculated weekly average demand.
  * Count of zero-demand weeks.
  * **Interactive SVG Sparkline Chart**: Custom-drawn trend line showing demand fluctuations over the 8-week period, complete with hover tooltips and target reference lines.
* Keyboard accessible: panel closes on pressing the `Escape` key.

### 4. Validated "Add Item" Form (Modal)
* Centered modal form containing fields for metadata, target demand, status, and 8 individual weekly demand inputs.
* **Robust Custom Validation**:
  * Item name must not be blank.
  * Target demand must be a positive integer ($> 0$).
  * Weekly demands (W1-W8) must be non-negative integers ($\ge 0$).
* Displays clear, red, inline error messages beneath incorrect fields.
* Keyboard accessible: closes on pressing `Escape`.
* Adds item immediately to the grid (and auto-opens its details) without page reloads.

### 5. Local Storage Persistence
* All data is persisted to browser `localStorage`. Newly added items survive browser reloads and page refreshes.

---

## Tech Stack
* **Vite** (Next-generation frontend tooling)
* **React** (Standard Hooks: `useState`, `useEffect`)
* **Custom Vanilla CSS** (Responsive layouts, translucent glassmorphism theme, smooth sidebar and modal animations)
* No heavy external packages used, keeping the footprint extremely light, clean, and fast.

---

## Setup & Running the Application

Follow these simple commands to run the application on your local machine.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v16+ recommended).

### 1. Install Dependencies
Run the following command inside the project directory to install React and other package requirements:
```bash
npm install
```

### 2. Start the Development Server
Launch the local dev server using:
```bash
npm run dev
```
Once started, open [http://localhost:5173](http://localhost:5173) in your web browser.

### 3. Build for Production
To bundle the project for production, run:
```bash
npm run build
```
The compiled, optimized bundle will be placed in the `dist/` directory.
