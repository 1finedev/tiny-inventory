# Changelog

## Current
### Responsive layout, navigation, and controls
- Collapsible desktop sidebar and mobile drawer navigation
- Category input upgraded to a combobox (select existing or add new)
- Metrics grid and product cards made responsive across breakpoints
- Pagination, sort controls, and total count surfaced in the dashboard

### Inventory and product workflow improvements
- Search moved to server-side with debounced client requests
- Add Product flow now creates product + inventory in one path
- Per-item low stock thresholds added and reflected in UI status
- Edit modal expanded to update product and inventory together

---

### Design system foundation
- Introduced shared UI component library and theme variables
- Consolidated page layouts onto reusable components
- Added shared CSS utilities and fixed build-time style issues

### Dashboard redesign iterations
- Single-page dashboard with modal-based editing and navigation
- Followed by a cohesive “Warehouse Noir” visual system with custom
  typography, palette, and motion

### Initial bootstrap
- Monorepo with `server`, `web`, and `shared` packages
- Hono + Bun backend with Mongoose models and Zod validation
- Vite + React frontend with typed API client and router
- Docker Compose for one-command local startup
