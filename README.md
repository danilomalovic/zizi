# L5X Ladder Logic IDE

A web-based IDE for viewing, editing, and exporting Allen-Bradley PLC ladder logic (RSLogix 5000 L5X files).

## Features

- **Upload L5X files** — Load Allen-Bradley RSLogix 5000 projects directly
- **Visual ladder logic editor** — See and edit rungs in an intuitive graphical interface
- **AI Assistant** — Ask the PLC ("Ask the PLC" panel) to explain, modify, or help with your logic
- **Tag management** — View all project tags and their usage
- **Search** — Find specific instructions, tags, or rungs quickly
- **Export to L5X** — Save your changes back to L5X format for use in RSLogix
- **Dark mode** — Easy on the eyes during long coding sessions
- **Undo/Redo** — Track your changes and revert as needed

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js + Express
- **Parse/Export:** Custom L5X and RLL parsers
- **UI Components:** Radix UI + shadcn/ui
- **AI:** OpenAI integration
- **Database:** PostgreSQL + Drizzle ORM

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
git clone <your-repo-url>
cd zizi
npm install
```

### Development

```bash
npm run dev
```

The app will start at `http://localhost:5000`.

### Build for Production

```bash
npm run build
npm run start
```

## How to Use

1. **Upload a file:** Click "Import L5X" in the sidebar to load an L5X file
2. **Explore the structure:** Browse projects, programs, routines, and tags in the left panel
3. **View ladder rungs:** Click a routine to see its ladder logic visualization
4. **Edit instructions:** Click on any instruction (XIC, XIO, MOV, etc.) to edit it
5. **Use the AI:** Ask the "PLC Assistant" questions about your logic
6. **Export:** Click "Export L5X" to download your modified project
7. **Undo changes:** Use Ctrl+Z or the undo button to revert
8. **Toggle dark mode:** Click the theme button in the bottom-right

## Project Structure

```
zizi/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page layouts
│   │   ├── utils/        # Parsers, exporters, AI
│   │   └── hooks/        # Custom React hooks
│   └── public/           # Static assets
├── server/               # Node.js backend
├── shared/               # Shared types and schemas
└── scripts/              # Utilities
```

## Key Files

- `client/src/utils/parser.ts` — L5X file parser
- `client/src/utils/rllParser.ts` — Ladder logic parser
- `client/src/utils/l5xExporter.ts` — L5X export function
- `client/src/utils/aiAssistant.ts` — AI integration
- `client/src/components/RungRenderer.tsx` — Ladder logic visualizer
- `server/routes.ts` — API endpoints

## Contributing

This is a personal project to help PLC programmers. Feel free to fork, modify, and improve!

## License

MIT

## Support

For issues or feature requests, open an issue on GitHub or ask the AI assistant in the app.

---

**Made with ❤️ for PLC enthusiasts**
