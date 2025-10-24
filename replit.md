# L5X File Parser Application

## Overview

This is a professional engineering tool for parsing and viewing RSLogix 5000 L5X (Logix 5000 XML) control files. The application provides an intuitive interface to upload L5X files, extract routines and tags from PLC programs, and view formatted XML content. It's designed as a developer tool with emphasis on clarity, information density, and efficient navigation of industrial automation data.

The application follows a clean, minimalist design approach inspired by developer tools like VS Code and Linear, prioritizing function over decoration with a focus on typography, spacing, and information accessibility.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Client-side routing using Wouter (lightweight alternative to React Router)
- Single-page application (SPA) architecture

**UI Component System:**
- Shadcn/ui component library (New York style variant)
- Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling with custom design tokens
- Class Variance Authority (CVA) for component variant management

**Design System:**
- Custom color system using HSL color space with CSS variables
- Support for light/dark modes via CSS class switching
- Typography system using Inter (interface) and JetBrains Mono (code display)
- Consistent spacing primitives (2, 3, 4, 6, 8 Tailwind units)
- Responsive layout: 3-column desktop grid, stacked mobile columns

**State Management:**
- React Query (TanStack Query) for server state and API caching
- Local component state with React hooks (useState, useEffect)
- React Hook Form with Zod validation for form handling
- Toast notifications for user feedback

**XML Processing:**
- `fast-xml-parser` library for parsing L5X files
- Browser's native DOMParser for XML extraction and manipulation
- Custom formatter for pretty-printing XML output

### Backend Architecture

**Server Framework:**
- Express.js as the HTTP server
- TypeScript for type-safe server code
- ESM module system throughout the codebase

**Development Setup:**
- Vite middleware mode for development hot-reloading
- Development-only plugins for Replit integration (error overlay, cartographer, dev banner)
- Production build compiles both client (Vite) and server (esbuild)

**File Structure:**
- `/client` - Frontend React application
- `/server` - Express backend with routes and storage
- `/shared` - Shared types and schemas (database models)
- Monorepo-style organization with path aliases (@, @shared, @assets)

**Current Implementation:**
- Minimal backend with in-memory storage interface
- Ready-to-extend storage abstraction (IStorage interface)
- Session management infrastructure in place (connect-pg-simple)

### Data Storage Solutions

**Database Configuration:**
- Drizzle ORM for type-safe database operations
- PostgreSQL dialect configured (via @neondatabase/serverless)
- Schema-first approach with Zod validation integration
- Migration system configured (./migrations directory)

**Schema Design:**
- Users table with username/password authentication
- UUID primary keys with PostgreSQL's gen_random_uuid()
- Type inference from Drizzle schema to TypeScript types

**Storage Layer:**
- Abstract IStorage interface for CRUD operations
- In-memory implementation (MemStorage) for development
- Designed for easy swap to database-backed storage
- Separation of concerns between storage interface and implementation

### Authentication & Authorization

**Planned Authentication:**
- User credentials stored with password hashing (infrastructure present)
- Session-based authentication via Express sessions
- PostgreSQL session store configured (connect-pg-simple)
- Cookie-based session management

**Current State:**
- Authentication infrastructure configured but not actively used
- Application currently operates without authentication requirements
- File parsing happens entirely client-side (no server interaction needed)

### Application Features

**L5X File Processing:**
- Client-side file upload and parsing (no server upload needed)
- Full hierarchical extraction of controller structure
- Parser returns structured object: `{ controllerName: string, controllerTags: string[], programs: [{ name: string, tags: string[], routines: string[] }] }`
- Extracts controller-scoped tags and program-scoped tags
- XML routine viewer with pretty-printing and formatting

**User Interface:**
- Two-panel layout: left panel (tree view + file upload), right panel (XML viewer)
- IDE-like collapsible tree view displaying full project hierarchy:
  - Controller name as root node
  - Controller Tags section (collapsible)
  - Programs section with each program showing Tags and Routines subfolders
  - All routines clickable to display XML
- Default expanded state: Controller, Programs, and all program subfolders open on load
- Chevron icons (▶/▼) indicate collapse/expand state
- Copy-to-clipboard for XML content
- Real-time file validation (L5X extension check)
- Loading states and error handling with user feedback
- Professional developer tool aesthetics matching VS Code/Linear design patterns

**Performance Optimizations:**
- Component state management with useState for tree collapse/expand
- Lazy XML extraction (only when routine is selected)
- Efficient tree rendering with proper React keys
- Smooth transitions for interactive elements

## External Dependencies

### Core Frontend Libraries
- **React & React DOM (^18.3.1)**: UI framework
- **Vite**: Build tool and development server
- **Wouter**: Lightweight client-side routing
- **TanStack React Query**: Server state management and caching

### UI Component Libraries
- **Radix UI**: 20+ primitive components for accessibility (@radix-ui/react-*)
- **Shadcn/ui**: Pre-built component library (configured, not installed as dependency)
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Class Variance Authority**: Component variant utilities
- **clsx & tailwind-merge**: Conditional className utilities

### Data & Validation
- **Zod**: TypeScript-first schema validation
- **React Hook Form**: Form state management
- **@hookform/resolvers**: Zod integration for forms
- **Drizzle Zod**: Drizzle schema to Zod conversion

### Backend & Database
- **Express**: Web server framework
- **Drizzle ORM**: TypeScript ORM for SQL databases
- **@neondatabase/serverless**: PostgreSQL driver for Neon
- **connect-pg-simple**: PostgreSQL session store

### Utilities & Tools
- **fast-xml-parser**: XML parsing library (critical for L5X processing)
- **date-fns**: Date manipulation utilities
- **nanoid**: Unique ID generation
- **embla-carousel-react**: Carousel/slider component

### Development Tools
- **TypeScript**: Type safety across the stack
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **Drizzle Kit**: Database migration tool
- **@replit/vite-plugin-***: Replit-specific development plugins (error modal, cartographer, dev banner)

### Font Resources
- **Google Fonts**: Inter, DM Sans, Fira Code, Geist Mono, Architects Daughter (loaded via CDN in index.html)