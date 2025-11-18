# Fixwise - Automated Code Fixing Dashboard

## Overview

Fixwise is a developer productivity tool that provides automated code fixing capabilities for React/Next.js codebases. The application features a multi-layer fixing system (6 layers) that detects and resolves common issues ranging from configuration problems to hydration mismatches. It provides real-time execution tracking, detailed logging, and comprehensive issue detection through a professional dashboard interface.

The system is built as a full-stack web application with a React frontend and Express backend, featuring WebSocket support for real-time updates during fix execution.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript in SPA mode (not Next.js App Router)

**Routing**: Wouter for client-side routing with a simple route structure (Dashboard page as main view)

**State Management**: 
- TanStack Query (React Query) for server state management and API data fetching
- Local React state (useState) for UI state like selected layers and real-time execution data
- WebSocket-based real-time state updates for execution logs and issues

**UI Component System**: 
- Radix UI primitives for accessible component foundations
- shadcn/ui component library (New York style) with custom Tailwind configuration
- Design system inspired by Linear and Vercel dashboards with focus on information density
- Custom CSS variables for theming with support for light/dark modes
- Typography: Inter for UI text, JetBrains Mono for code/technical content

**Build System**: Vite with React plugin, esbuild for production builds

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js

**API Design**: RESTful endpoints with WebSocket support for real-time updates
- `/api/layers` - Retrieve fix layer metadata
- `/api/runs` - Execution run management (create, retrieve, update)
- `/api/runs/:id/logs` - Execution logs for specific runs
- `/api/runs/:id/issues` - Detected issues for specific runs
- WebSocket endpoint `/ws` for real-time push notifications

**Execution Model**: The backend executes Node.js scripts from the `Fixwise/` directory (fix-layer-1 through fix-layer-6, plus master script) using child process execution. Scripts perform actual code fixes on the filesystem.

**Real-time Communication**: WebSocket server using `ws` library broadcasts execution events (logs, issues, status updates) to all connected clients

**Session Management**: connect-pg-simple for PostgreSQL-based session storage (though database not yet fully integrated)

### Data Storage

**Database ORM**: Drizzle ORM configured for PostgreSQL via `@neondatabase/serverless` driver

**Schema Design** (defined but not fully implemented):
- `fix_layers` - Metadata about each fixing layer (name, description, script reference)
- `execution_runs` - Tracks execution attempts with status, timing, and issue counts
- `execution_logs` - Timestamped log entries with severity levels
- `detected_issues` - Individual issues found during execution with severity classification

**Current Implementation**: In-memory storage (MemStorage class) used as fallback until database is provisioned. Data persists only during server runtime.

**Data Validation**: Zod schemas generated from Drizzle schema definitions for runtime type safety

### Key Architectural Decisions

**Separation of Fix Logic**: Fix scripts live in `Fixwise/` directory as standalone Node.js scripts, not embedded in the application. This allows:
- Independent execution and testing of fix logic
- Easy addition of new fix layers without application changes
- Potential future use outside the dashboard interface

**Real-time Updates Strategy**: WebSocket chosen over polling for:
- Immediate feedback during long-running fix executions
- Reduced server load compared to frequent HTTP polling
- Better user experience with live log streaming

**In-Memory Storage Fallback**: Pragmatic choice to enable development and testing without database dependency, with clean interface (IStorage) for future database integration

**Type Safety Throughout**: TypeScript across entire stack with shared types in `/shared` directory ensuring consistency between client and server

**Monorepo Structure**: Client and server code in same repository with shared schema/types, simplifying development while maintaining clear boundaries

## External Dependencies

### Third-Party UI Libraries
- **Radix UI**: Comprehensive collection of unstyled, accessible component primitives (accordion, dialog, dropdown, toast, etc.)
- **shadcn/ui**: Pre-built component implementations built on Radix UI
- **Lucide React**: Icon library for UI elements
- **Embla Carousel**: Carousel/slider functionality
- **cmdk**: Command palette component
- **Recharts**: Charting library (imported but not actively used in current views)

### State Management & Data Fetching
- **TanStack Query v5**: Server state management, caching, and data synchronization
- **React Hook Form**: Form state management with Zod resolver integration
- **Wouter**: Lightweight client-side routing

### Styling & Design
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **class-variance-authority**: Type-safe variant-based component styling
- **tailwind-merge + clsx**: Utility for merging Tailwind classes intelligently

### Backend Services
- **WebSocket (ws)**: Real-time bidirectional communication
- **Drizzle ORM**: Type-safe SQL query builder and schema management
- **@neondatabase/serverless**: PostgreSQL client for serverless environments

### Development Tools
- **Vite**: Build tool and development server
- **esbuild**: JavaScript bundler for production builds
- **tsx**: TypeScript execution for development server
- **@replit Plugins**: Replit-specific development enhancements (cartographer, error overlay, dev banner)

### Type Safety
- **TypeScript**: Primary language across stack
- **Zod**: Runtime schema validation and type inference
- **drizzle-zod**: Bridge between Drizzle schemas and Zod validators

### Database
- **PostgreSQL**: Configured via Drizzle but not yet provisioned (DATABASE_URL required)
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Build & Deployment
- **Node.js v18+**: Runtime environment
- **PostCSS + Autoprefixer**: CSS processing pipeline