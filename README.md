# Fridge Friend

A smart kitchen companion that helps you track what's in your fridge, plan meals, and reduce food waste. Built with React and a lightweight Express + SQLite backend.

![Fridge Friend](https://img.shields.io/badge/version-2.0.0-c4956a) ![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

**Fridge Tracker** — Keep a real-time inventory of everything in your fridge with automatic expiry estimates, category sorting, and color-coded freshness badges.

**Quick Add** — Search a database of 500+ foods with nutrition data and shelf life info. Tap to add instantly.

**Barcode Scanner** — Snap a photo of any barcode. The app reads it and identifies the product automatically.

**Receipt Scanner** — Photograph a grocery receipt and AI extracts every item in one shot.

**Pantry Staples** — Track your always-on-hand essentials (rice, olive oil, salt, etc.) with a quick in-stock / out-of-stock toggle.

**Meal Planner** — Plan breakfast, lunch, and dinner across the week in a visual grid.

**Shopping List** — Simple checklist with tap-to-complete.

**AI Chef** — Get meal suggestions that prioritize ingredients expiring soonest. Supports quick ideas or full 3-day meal plans.

---

## Screenshots

| Fridge View | Quick Add | Meal Planner |
|:-----------:|:---------:|:------------:|
| <img src="docs/screenshots/fridge.png" width="250"> | <img src="docs/screenshots/quick-add.png" width="250"> | <img src="docs/screenshots/meals.png" width="250"> |

> To add screenshots, create a `docs/screenshots/` folder and add your images there.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6 |
| Backend | Express 5, better-sqlite3 |
| Database | SQLite with FTS5 full-text search |
| AI Features | Claude API (barcode lookup, receipt parsing, meal suggestions) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)

### Installation

```bash
# Clone the repo
git clone https://github.com/colingalbraith/FoodFriend.git
cd FoodFriend

# Install dependencies
npm install

# Start the dev server (frontend + API)
npm run dev
```

The app will be available at **http://localhost:5173**. The API server runs on port 3001.

### Access from your phone

The dev server binds to all network interfaces. Find your local IP and open it on any device on the same Wi-Fi:

```
http://<your-local-ip>:5173
```

### Production build

```bash
npm run build
npm run preview
```

---

## Project Structure

```
FoodFriend/
├── index.html              # Entry point
├── vite.config.js          # Vite config with API proxy
├── package.json
├── server/
│   ├── index.js            # Express API server
│   └── seed.js             # 500+ food items with nutrition data
├── src/
│   ├── main.jsx            # App bootstrap
│   ├── App.jsx             # Root component, state management, tabs
│   ├── constants/
│   │   ├── categories.js   # Food categories, tab definitions
│   │   ├── expiryEstimates.js  # Auto-expiry lookup table
│   │   └── storage.js      # Storage keys, default staples
│   ├── utils/
│   │   ├── dateHelpers.js  # Date math, expiry badges, week dates
│   │   └── itemHelpers.js  # Auto-expiry matching, ID generation
│   ├── styles/
│   │   └── global.js       # CSS-in-JS global styles and animations
│   └── components/
│       ├── ui/             # Reusable UI primitives
│       │   ├── Badge.jsx
│       │   ├── Card.jsx
│       │   ├── EmptyState.jsx
│       │   └── Modal.jsx
│       ├── fridge/         # Fridge tab components
│       │   ├── FridgeTab.jsx
│       │   ├── QuickAddPanel.jsx
│       │   ├── ManualAddForm.jsx
│       │   ├── BulkAddPanel.jsx
│       │   ├── VoiceInputPanel.jsx
│       │   ├── BarcodeScanPanel.jsx
│       │   └── ReceiptScanPanel.jsx
│       ├── meals/
│       │   └── MealPlanTab.jsx
│       ├── shopping/
│       │   └── ShoppingTab.jsx
│       └── chef/
│           └── ChefTab.jsx
```

---

## API

The backend exposes a simple REST API for searching the food database:

| Endpoint | Description |
|----------|-------------|
| `GET /api/foods?q=term` | Search foods by name (FTS5 prefix + LIKE fallback) |
| `GET /api/foods/categories` | List all food categories |
| `GET /api/foods/:id` | Get a single food item by ID |

The database is seeded automatically on first run with 500+ food items including calories, macros, and estimated shelf life.

---

## Contributing

Contributions are welcome! Here's how to get involved:

### Quick Start

1. **Fork** this repository
2. **Clone** your fork locally
   ```bash
   git clone https://github.com/<your-username>/FoodFriend.git
   cd FoodFriend
   npm install
   ```
3. **Create a branch** for your feature or fix
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and test locally with `npm run dev`
5. **Commit** with a clear message describing what and why
   ```bash
   git commit -m "Add feature X to improve Y"
   ```
6. **Push** and open a Pull Request
   ```bash
   git push origin feature/your-feature-name
   ```

### Guidelines

- **Keep PRs focused.** One feature or fix per PR.
- **Test on mobile.** This app is designed as a mobile-first experience. Open it on your phone before submitting.
- **Match the existing style.** The codebase uses inline styles and functional React components. No external CSS frameworks or class components.
- **Don't add heavy dependencies.** This project intentionally stays lightweight.
- **Write clear commit messages.** Explain *why*, not just *what*.

### Ideas for Contributions

- Sharing fridge inventory between household members
- Push notifications for expiring items
- Dark mode
- Better offline support with service workers
- Import/export fridge data
- More food items in the seed database
- Localization / i18n

---

## License

MIT
