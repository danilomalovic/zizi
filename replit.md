# L5X File Parser Application

## Overview

This application is a professional engineering tool for parsing and viewing RSLogix 5000 L5X (Logix 5000 XML) control files. It enables users to upload L5X files, extract routines and tags from PLC programs, and view formatted XML content through an intuitive interface. The primary purpose is to serve as a developer tool, emphasizing clarity, information density, and efficient navigation of industrial automation data. It aims to provide full CRUD editing capabilities for ladder logic using natural language intent detection, allowing users to ask questions, create, and delete ladder logic elements. The long-term vision is to establish this as a leading, AI-powered developer tool for industrial automation, streamlining PLC programming and maintenance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18 and TypeScript, using Vite for fast development and Wouter for client-side routing, forming a Single-Page Application (SPA). The UI system leverages Shadcn/ui (New York style variant) atop Radix UI primitives for accessible components, styled with Tailwind CSS and custom design tokens. State management uses React Query for server state and API caching, with local component state managed by React hooks. Form handling is done with React Hook Form and Zod validation. XML parsing is handled by `fast-xml-parser` and the browser's native DOMParser.

### Backend Architecture

The backend uses Express.js with TypeScript and ESM modules. It's configured with Vite middleware for development and a production build process utilizing esbuild. The file structure follows a monorepo style with `/client`, `/server`, and `/shared` directories. An abstract `IStorage` interface is used for data persistence, currently with an in-memory implementation but designed for database integration. Authentication infrastructure is in place using Express sessions and `connect-pg-simple`, though not actively used.

### AI Assistant API

The application integrates an AI Assistant accessible via API endpoints:
- `POST /api/ai/ask`: Provides conversational explanations of ladder logic using OpenAI GPT-4o, with full project context awareness.
- `POST /api/ai/edit`: Translates natural language requests into JSON structures for creating new ladder logic rungs, enforcing strict JSON output.
- `POST /api/ai/remove`: Intelligently identifies and returns the rung number to remove based on natural language descriptions, enforcing strict JSON output.

### Data Storage Solutions

The system uses Drizzle ORM for type-safe database operations, configured for a PostgreSQL dialect via `@neondatabase/serverless`. It follows a schema-first approach with Zod validation and includes a migration system.

### Application Features

- **L5X File Processing**: Client-side parsing of L5X files, extracting a hierarchical structure of controllers, programs, routines, and tags. It includes a comprehensive RLL (Relay Ladder Logic) parser that converts rung text into a JSON syntax tree, supporting various instructions, nested branches, and parallel branches.
- **User Interface**: A three-column responsive grid layout features:
    - A **Left Panel** with a file upload and an IDE-like collapsible tree view displaying the project hierarchy.
    - A **Center Panel** providing a visual ladder logic viewer with SVG rendering of rungs, instructions, and tags.
    - A **Right Panel** with tabs for:
        - **Ask AI**: AI-powered chat assistant for questions, edits, and removals.
        - **Add**: Visual instruction palette for adding ladder logic instructions.
- **Project Creation**: Users can start from scratch without importing an L5X file:
    - **New Project** (`NewProjectDialog.tsx`): Creates a new controller with initial program and routine.
    - **New Routine** (`NewRoutineDialog.tsx`): Adds routines to existing programs.
- **Traditional Ladder Logic Editing**: Click a rung to select it for editing, then add instructions that connect together on the same rung. Create new rungs with the "Add New Rung" button.
- **Instruction Palette** (`InstructionPalette.tsx`): A categorized panel with 40+ ladder logic instructions organized in 6 categories:
    - Bit Instructions (XIC, XIO, OTE, OTL, OTU, ONS, OSR, OSF)
    - Timer/Counter (TON, TOF, RTO, CTU, CTD, RES)
    - Compare (EQU, NEQ, LES, LEQ, GRT, GEQ, LIM)
    - Math (ADD, SUB, MUL, DIV, MOD, NEG, ABS, SQR)
    - Move/Logical (MOV, MVM, CLR, BTD, AND, OR, XOR, NOT)
    - Program Control (JSR, RET, JMP, LBL, MCR, AFI, NOP)
- **Instruction Editor** (`InstructionEditor.tsx`): A dialog for configuring instruction parameters when adding via the palette. Supports tag selection from the parsed project.
- **AI Chat Assistant**: A context-aware chat panel with three modes:
    - **Ask Mode**: For natural language explanations of ladder logic.
    - **Edit Mode**: Activated by `/edit` or natural language intent, for creating new rungs via AI-generated JSON.
    - **Remove Mode**: Activated by `/remove` or natural language intent, for intelligently deleting rungs.
- Real-time file validation, loading states, error handling, and performance optimizations are integrated throughout.

## External Dependencies

### Core Frontend Libraries
- React
- Vite
- Wouter
- TanStack React Query

### UI Component Libraries
- Radix UI
- Shadcn/ui
- Tailwind CSS
- Lucide React
- Class Variance Authority

### Data & Validation
- Zod
- React Hook Form
- Drizzle Zod

### Backend & Database
- Express
- Drizzle ORM
- @neondatabase/serverless
- connect-pg-simple
- OpenAI SDK

### Utilities & Tools
- fast-xml-parser
- date-fns
- nanoid
- embla-carousel-react

### Development Tools
- TypeScript
- tsx
- esbuild
- Drizzle Kit
- @replit/vite-plugin-*