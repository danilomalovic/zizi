# L5X File Parser Application

## Overview

This is a professional engineering tool for parsing and viewing RSLogix 5000 L5X (Logix 5000 XML) control files. The application provides an intuitive interface to upload L5X files, extract routines and tags from PLC programs, and view formatted XML content. It's designed as a developer tool with emphasis on clarity, information density, and efficient navigation of industrial automation data.

The application follows a clean, minimalist design approach inspired by developer tools like VS Code and Linear, prioritizing function over decoration with a focus on typography, spacing, and information accessibility.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**October 24, 2025 - Full CRUD Editing Capabilities:**
- Refactored parser to perform deep parsing upfront instead of lazy parsing
- Updated `ParsedResult` structure: Controller → Programs[] → Routines[] → Rungs[]
- All rungs are now parsed during file upload and stored in deeply nested state
- Removed `originalXML`, `parsedRungs`, and `loadingRungs` states from home.tsx
- Added `addRungToRoutine()` and `removeRungFromRoutine()` functions for immutable state updates
- ChatPanel now supports three modes of operation:
  - **Ask mode** (default): Natural language explanations of ladder logic
  - **Edit mode** (`/edit`): Create new rungs from natural language
  - **Remove mode** (`/remove`): Delete rungs by natural language description
- Added `/api/ai/remove` endpoint for intelligent rung removal detection
- AI can identify which rung to remove based on instruction type, tag name, or rung number
- Added JSON validation for both edit and remove operations
- Improved error handling with toast notifications for all operations
- UI updated with helpful command guide in the chat welcome screen
- Full ladder logic editing with visual feedback now operational

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
- **AI Assistant API:**
  - POST `/api/ai/ask` - Conversational explanation endpoint
    - Accepts user questions with project context
    - Integrates with OpenAI GPT-4o via Replit AI Integrations
    - Processes questions with full awareness of controller, programs, routines, and tags
    - Returns natural language explanations with **🔧 Rung X:** formatting
    - Temperature: 0.3 for consistent but natural responses
  - POST `/api/ai/edit` - Natural language to JSON translation endpoint
    - Accepts natural language ladder logic requests
    - Returns ONLY raw JSON structures (no markdown, no explanations)
    - Temperature: 0.0 for deterministic, consistent JSON output
    - Strict system prompt enforces JSON-only responses
    - Validates tag names and routine names against project context
    - Integrated with state management for live rung additions
  - POST `/api/ai/remove` - Intelligent rung removal endpoint
    - Accepts natural language removal requests
    - Returns JSON with rung number to remove: `{"rungNumber": N}`
    - Temperature: 0.0 for deterministic rung identification
    - Analyzes rung context to identify target by description, instruction type, or tag name
    - Integrated with state management for live rung deletion

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
- Deep parsing of entire project structure on upload
- Parser returns deeply nested object: Controller → Programs[] → Routines[] → Rungs[]
- Each Rung contains: `{ number, text, parsed }` with JSON syntax tree
- Extracts controller-scoped tags and program-scoped tags
- **RLL (Relay Ladder Logic) Parser:**
  - Parses ladder logic rung text into JSON syntax trees
  - Handles basic instructions (XIC, OTE, etc.) with single parameters
  - Handles multi-parameter instructions (MOV, etc.) with source/dest fields
  - Fully supports nested branches `[...]` and parallel branches (comma-separated)
  - Respects parentheses depth when parsing comma-separated parameters
  - Preserves PLC rung numbering from XML
  - Example: `[XIC(Tag.0),XIC(Tag.1)]MOV(32,Dest);` → Branch structure with parallel paths and MOV instruction

**User Interface:**
- Three-column grid layout (responsive to xl breakpoint):
  - **Left Panel (xl:col-span-3)**: File upload + IDE-like collapsible tree view
  - **Center Panel (xl:col-span-5)**: Visual ladder logic viewer with SVG rendering
  - **Right Panel (xl:col-span-4)**: AI-powered "Ask the PLC" chat assistant
- **Project Tree View:**
  - IDE-like collapsible tree displaying full project hierarchy
  - Controller name as root node
  - Controller Tags section (collapsible)
  - Programs section with each program showing Tags and Routines subfolders
  - All routines clickable to display visual ladder diagrams and update chat context
  - Default expanded state: Controller, Programs, and all program subfolders open on load
  - Chevron icons (▶/▼) indicate collapse/expand state
- **Visual Ladder Logic Viewer:**
  - SVG-based ladder diagram rendering for each rung
  - Left and right power rails with proper spacing
  - Visual instruction symbols:
    - XIC (Normally Open Contact): `| |`
    - XIO (Normally Closed Contact): `|/|`
    - OTE (Output Energize): `( )`
    - OTL/OTU (Latch/Unlatch): `(L)` / `(U)`
    - MOV and other box instructions: Rectangle with source/dest
  - Tag names displayed above instruction symbols with consistent spacing
  - Parallel branches with proper split/merge visualization
  - All branches extend to merge bus regardless of length
  - Professional ladder diagram aesthetics
- **AI Chat Assistant ("Ask the PLC"):**
  - Context-aware chat panel with full project awareness
  - Real-time conversation with AI expert on Rockwell Automation programming
  - Message history with user/assistant message differentiation
  - Automatic context passing (full project + currently selected routine)
  - Integrated with OpenAI GPT-4o via Replit AI Integrations
  - Backend API endpoints ensure secure API key management
  - **Three Modes of Operation:**
    - **Ask Mode (default)**: Natural language responses with **🔧 Rung X:** formatting
      - Uses `/api/ai/ask` endpoint with temperature 0.3
      - Returns conversational, friendly explanations of ladder logic
      - Answers questions about routines, tags, and program structure
      - Example: "What does rung 0 do?" or "Explain this routine"
    - **Edit Mode (slash command)**: Natural language to ladder logic creation
      - Activated by typing `/edit` before the request
      - Uses `/api/ai/edit` endpoint with temperature 0.0 for deterministic output
      - Returns ONLY raw JSON structures representing ladder logic instructions
      - System prompt enforces strict JSON-only responses (no markdown, no explanations)
      - Example: `/edit add a rung with an XIC for 'Start' and an OTE for 'Motor'`
      - Supports complex structures like branches, multi-parameter instructions, and nested logic
      - Automatically creates new rungs in the selected routine with immutable state updates
      - New rungs appear immediately in the visual ladder logic viewer
    - **Remove Mode (slash command)**: Intelligent rung deletion
      - Activated by typing `/remove` before the request
      - Uses `/api/ai/remove` endpoint with temperature 0.0 for deterministic detection
      - Returns JSON indicating which rung to remove: `{"rungNumber": N}`
      - AI analyzes rung context to identify target based on description
      - Example: `/remove the ProgramTwoSINT.0` or `/remove rung 0`
      - Automatically removes the identified rung from the routine
      - Deletion confirmed with toast notification and chat message
  - Full CRUD capabilities: Learn, Create, and Delete ladder logic operations
- Real-time file validation (L5X extension check)
- Loading states and error handling with user feedback
- Professional developer tool aesthetics matching VS Code/Linear design patterns

**Performance Optimizations:**
- Component state management with useState for tree collapse/expand
- Deep parsing performed once during file upload (all rungs parsed upfront)
- Efficient tree rendering with proper React keys
- Smooth transitions for interactive elements
- Immutable state updates using spread operators for React optimization

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
- **OpenAI SDK**: AI chat completions for the "Ask the PLC" feature

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