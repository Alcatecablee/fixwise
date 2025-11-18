# Design Guidelines: Automated Code Fixing Dashboard

## Design Approach

**Selected Approach:** Design System (Material Design) with inspiration from Linear and Vercel Dashboard

**Justification:** Developer productivity tool requiring information density, clear hierarchy, and consistent patterns. Users need efficient navigation through complex data (logs, diffs, status indicators) with focus on functionality over aesthetics.

**Key Principles:**
- Clarity and efficiency over visual flourish
- Information density with breathing room
- Immediate status recognition through hierarchy
- Code-first typography and spacing

## Typography

**Font Families:**
- **UI Text:** Inter via Google Fonts (clean, professional, excellent readability)
- **Code/Technical:** JetBrains Mono via Google Fonts (code snippets, file paths, logs)

**Hierarchy:**
- Page titles: text-2xl, font-semibold
- Section headers: text-lg, font-medium
- Card titles: text-base, font-medium
- Body text: text-sm
- Code/logs: text-sm (monospace)
- Labels/meta: text-xs

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- Component padding: p-4 or p-6
- Section gaps: gap-4 or gap-6
- Card spacing: space-y-4
- Grid gaps: gap-6 or gap-8

**Grid Structure:**
- Main dashboard: 12-column grid (grid-cols-12)
- Layer cards: 4-column responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Content areas: max-w-7xl mx-auto with px-6

## Component Library

### Navigation & Layout
- **Top Navigation Bar:** Fixed header with tool branding, global actions (Run All, Dry Run, Settings)
- **Sidebar:** Collapsible left panel (w-64) showing layers, recent runs, quick stats
- **Main Content Area:** Scrollable with clear section divisions

### Core Components

**Layer Cards:**
- Bordered containers with distinct header showing layer number, title, and status badge
- Description text below header
- Action buttons footer (Run Layer, View Details)
- Severity indicator strip on left edge

**Severity Indicators:**
- Visual badges with icon + label
- Critical: Filled badge with alert icon
- High: Filled badge with warning icon  
- Medium: Outlined badge
- Low: Ghost badge
- Use consistent sizing: px-3 py-1

**Execution Log Panel:**
- Full-width terminal-style container with dark treatment
- Monospace font for all log entries
- Timestamp prefix for each line
- Icon indicators (✅ ❌ ⚠️ 📝) inline with messages
- Auto-scroll to bottom, max-height with overflow-y-auto

**File Browser:**
- Tree structure with expand/collapse controls
- File type icons
- Modified file highlighting
- Click to view diff

**Diff Viewer:**
- Split-pane layout (before | after)
- Line numbers in gutter
- Syntax highlighting for code
- Change indicators (+ - ~) with subtle background treatments

**Control Panel:**
- Checkbox group for layer selection
- Primary action button (large, prominent)
- Secondary actions (ghost or outline variants)
- Progress bar showing overall completion

**Status Cards:**
- Compact metric displays
- Large number with small label below
- Icon accent in corner
- Grid layout: grid-cols-2 md:grid-cols-4

### Data Display

**Progress Indicators:**
- Linear progress bars (h-2 rounded-full)
- Circular loaders for active operations
- Percentage display alongside bar

**Tables:**
- Striped rows for readability
- Fixed header on scroll
- Sortable columns with indicator icons
- Compact row spacing (py-2)

**Badges & Tags:**
- Rounded-full for status indicators
- Rounded-md for category tags
- Consistent padding: px-2.5 py-0.5

## Interactions

**States:**
- Hover: Subtle lift (shadow-md) on interactive cards
- Active/Running: Pulsing indicator
- Disabled: Reduced opacity (opacity-50)
- Loading: Skeleton screens for slow-loading data

**Animations:** Minimal and purposeful
- Smooth transitions: transition-all duration-200
- Collapsible sections: Simple slide animations
- Progress updates: Smooth bar fills
- No decorative animations

## Layout Specifications

**Dashboard Home:**
- Hero stats row: 4 status cards showing total fixes, critical issues, last run time, success rate
- Layer grid: 4 cards in responsive grid
- Recent activity panel below
- Sticky action bar at bottom on mobile

**Layer Detail View:**
- Breadcrumb navigation at top
- Layer info header with run button
- Issue list grouped by severity
- Affected files browser
- Execution history timeline

**Diff View:**
- Header with file path and change summary
- Split-pane diff (50/50 width)
- Line-by-line comparison
- Navigation controls to jump between changes

**Settings/Configuration:**
- Form layout with clear sections
- Left-aligned labels
- Help text below inputs
- Save/Cancel actions fixed bottom-right

## Accessibility

- All interactive elements keyboard navigable
- Focus indicators on all controls (ring-2 ring-offset-2)
- ARIA labels for icon-only buttons
- Semantic HTML throughout
- High contrast text ratios
- Screen reader announcements for progress updates

## No Images Required

This is a data-intensive developer tool - no hero images or decorative imagery needed. Focus is on clear information architecture and functional UI components.