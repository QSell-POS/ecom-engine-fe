# Data grid

One grid for every list in the app: table on desktop, swipeable list on mobile,
client-side or server-side data, same API.

## Layers

| Layer | Path | Depends on |
| --- | --- | --- |
| Core: column model, query engine, URL format, CSV, sources | `src/lib/data-grid/` | nothing (pure TS: runs in browser, server, React Native) |
| Web renderer: `<DataGrid>`, `useDataGrid` | `src/components/data-grid/` | React, shadcn/ui |
| Entity config: columns per resource | `src/lib/api/<entity>/grid.ts` | core only |

Because entity column files are pure data, the **same config** drives the
server endpoint (`/api/admin/products`), the server-rendered first page, the web
grid, and a future native app (which renders `mobile` roles with its own
components and calls the same endpoint).

## Usage

```tsx
// 1. Columns: pure, shareable (src/lib/api/brand/grid.ts)
export const brandColumns = defineColumns<Brand>([
  { id: "name", header: "Name", accessor: "name", defaultPin: "left", mobile: { role: "title" } },
  { id: "status", header: "Status", accessor: (b) => (b.isActive ? "active" : "inactive"),
    type: "status", statuses: activeStatuses, filter: { type: "multiselect" }, mobile: { role: "status" } },
  { id: "updatedAt", header: "Updated", accessor: "updatedAt", type: "date", filter: { type: "date-range" } },
]);

// 2. Grid
<DataGrid
  id="brands"                       // namespaces saved view prefs
  noun={["brand", "brands"]}
  columns={brandColumns}
  source={clientSource(brands)}     // or httpSource("/api/admin/brands", brandColumns)
  getRowId={(b) => b.id}
  rowActions={[{ id: "delete", label: "Delete", tone: "destructive", swipe: "trailing",
    confirm: (b) => ({ title: `Delete ${b.name}?` }), optimistic: "remove",
    run: async (b) => toOutcome(await deleteBrandAction({ id: b.id })) }]}
  bulkActions={[...]}
  onMutated={() => router.refresh()}
/>
```

### Workspace (master–detail)

Pass `workspace` and opening a row (click, Enter, tap) keeps the user in one
workspace instead of navigating to a separate page:

```tsx
<DataGrid ...
  workspace={{
    icon: Package,                                   // header tile when there's no `media` column
    render: (p, { open, close }) => <ProductDetail product={p} />,
    loadRow: (id, signal) => fetchProduct(id, signal), // records not in the loaded rows
  }}
/>
```

- **Left:** the same grid state as a list (search, filter, sort, pagination,
  counts, loading/empty/error), using the columns' `mobile` roles.
- **Right:** a standard record header (title, status, subtitle from the
  `mobile` roles) plus `render(row)`. Build bodies from `DetailSection`,
  `DetailFields` and `DetailStats`. The toolbar has previous/next (moving
  across pages), the position ("26 of 180"), and `rowActions` (destructive
  ones in the overflow menu; deleting the open record moves to its neighbour).
- **URL:** `?open=<id>` next to the grid params, so a record is shareable.
  Opening from the table adds a history entry (Back returns to the table);
  moving between records doesn't.
- **Keyboard:** `↑↓` / `j k` move through records, `Enter` in the list focuses
  the record, `Esc` returns to the table, and `/` searches.
- **Layout:** the workspace fills the area under the navbar edge to edge, and
  the page's `PageHeader` hides while it's open. The panes scroll
  independently in `ScrollArea`s. Below 1024px only the record shows, with a
  back button.

### Column options

`type` (`text · number · currency · percent · date · datetime · boolean · status · tags`)
drives formatting, alignment, sorting and CSV. `filter`: `text · multiselect ·
range · boolean · date-range` (multiselect options are derived from data in
client mode; pass `facets` in server mode). Also: `sortable`, `searchable`,
`hideable`, `defaultHidden`, `pinnable`, `defaultPin`, `width/minWidth/maxWidth`,
`resizable`, `align`, `format`, `description` (header tooltip).

**Mobile:** `mobile: { role }` places a column in the card: `media · title ·
subtitle · status · trailing · meta`. Columns without a role are left out, so
the card is a summary, not a squeezed row.

**Web renderers** are separate from columns (`cells={{ name: (row) => … }}`)
so column files stay platform-neutral.

## What people see (progressive disclosure)

Everyday use needs no explanation. Everything else is one step away, never on screen by default.

| Always visible | On hover / when needed | One click away | Power users |
| --- | --- | --- | --- |
| Search, **Filter**, **Sort**, rows, numbered pages | Row checkboxes, row `…` menu, sort arrow on headers, column resize | Filter: pick a field, then values (Command popover). Sort: "Price: High to low". **Customize** (⚙): columns, freeze, order, row height, rows per page, layout. **More** (`…`): import, download | Right-click a header: sort, freeze, hide. `⌘K` / `Ctrl K` "Find an action" command menu. `?` shortcuts dialog. Shift+click to sort by several columns |

- Words over jargon: "Low to high / Newest first / A to Z", "Freeze column",
  "Download as CSV", "Showing 1–25 of 180 products", and filter chips that
  read as sentences ("Status is Draft", "Price $50 or more"). Clicking a chip edits it.
- No card around the table: the toolbar sits on the page, rows are separated
  by hairline borders, and pages are plain numbers (`← Previous 1 2 3 … 8 Next →`).

## Behaviour

- **Modes:** `clientSource(rows)` filters/sorts/pages locally (synchronous, no
  spinners). `serverSource(load)` / `httpSource(url)` send the query and expect
  `{ rows, total }`; stale requests are aborted, the previous page stays visible
  while loading, and `initialResult` renders the first page on the server.
- **Query:** debounced search (Enter = immediate), multi-column sort
  (Shift+click), typed filters with removable chips, pagination: all mirrored to
  the URL via `history.replaceState` (shareable, no server round-trip).
- **View preferences** (saved per `id`): column visibility, order (drag),
  pinning, widths (drag / double-click to reset), density, and
  presentation (`Auto` = table ≥768px, list below; users can force either).
- **Selection:** per row, per page, and *all matching the current filters*
  (bulk actions get `{ kind: "all", query, excludedIds }`). It resets when the
  result set changes.
- **Actions:** row menu, mobile swipe (`leading`/`trailing`), long-press to
  select, bulk bar (inline on desktop, bottom-docked on mobile). `confirm`
  gates destructive actions; `optimistic` updates instantly and rolls back with
  an error toast if `run` fails.
- **Tree / detail:** `getSubRows` for nested rows (search keeps matching
  branches, auto-expanded); `renderDetail` for an expandable panel.
- **Import/export:** CSV export of the current page, all matching rows, or the
  selection (visible columns, machine-readable numbers/dates). `onImport` adds
  a drag-and-drop CSV import with preview.
- **Keyboard:** `/` search · `↑↓`/`j k` rows · `Enter` open · `x`/`Space` select ·
  `←→` collapse/expand · `Esc` clear · `[` `]` pages.
- **Scrolling:** the grid never scrolls vertically; it grows with its rows and
  the page scrolls. In the admin that is `AppScrollArea` (the window itself
  never scrolls). The column header sticks to the top of the page scroller in
  its own strip, kept in horizontal sync with the body, which scrolls sideways
  when columns overflow. Don't wrap a grid in `overflow-hidden`: it breaks the
  sticky header (use `overflow-clip`).
- **States:** skeleton rows on first load, a deferred progress bar on refetch
  (no flash on fast responses), inline error with retry, product-specific empty
  state (no data) vs. "no matches" with clear filters.
