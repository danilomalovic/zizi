# Design Guidelines for L5X File Parser Application

## Design Approach

**Selected Framework**: Design System Approach (Developer Tool Category)

**Primary References**: 
- VS Code's clean, information-dense interface patterns
- Linear's minimalist developer UI with exceptional typography
- GitHub's code viewer and file browser patterns
- Material Design principles for data-heavy applications

**Core Principle**: This is a professional engineering tool where clarity, efficiency, and information accessibility trump decorative elements. Every pixel serves a functional purpose.

---

## Typography System

**Font Families**:
- Interface Text: Inter (weights: 400, 500, 600)
- Code/XML Display: JetBrains Mono (weight: 400)

**Hierarchy**:
- Page Title: 2xl, weight 600
- Section Headers: lg, weight 600
- List Items: base, weight 400
- Counts/Metadata: sm, weight 500
- Code Viewer: sm monospace

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 3, 4, 6, and 8 for consistent rhythm
- Component padding: p-4 to p-6
- Section gaps: gap-4 to gap-6
- List item spacing: py-2 to py-3

**Grid Structure**:
```
Desktop Layout (3-column):
- Left Panel (25%): File upload + Routines list
- Middle Panel (25%): Tags list
- Right Panel (50%): XML Viewer

Mobile Layout (stacked):
- Single column, collapsible sections
```

**Container Strategy**:
- Main container: Full viewport height with proper overflow handling
- List containers: Fixed height with internal scroll (h-64 to h-96)
- XML viewer: Flexible height, occupies remaining space

---

## Component Library

### File Upload Area
- Styled as a prominent button-like zone at the top
- Clear visual affordance with dashed border treatment
- Upload icon + "Select .L5X File" text
- File name display after selection with file size
- Loading state with spinner indicator
- Error state with inline message display

### Search Inputs
- Positioned at top of each list section
- Search icon prefix
- Placeholder text: "Search routines..." / "Search tags..."
- Real-time filtering with debounce consideration
- Clear button (×) when text is entered

### List Components
**Routine List**:
- Two-line items: Routine name (bold) + Program name (muted, smaller)
- Selected state with distinct background treatment
- Hover state for better interactivity
- Count badge at section header
- Scroll container with sticky header

**Tag List**:
- Single-line items with tag name
- Program origin shown in parentheses (muted)
- Separate visual grouping for Controller vs Program tags
- Count badges for each category
- Scroll container with sticky header

### XML Viewer
**Structure**:
- Header bar with routine name and program context
- Code block with proper syntax preservation
- Line numbers optional but recommended
- Horizontal scroll for long lines
- Copy-to-clipboard button in header
- Monospace font with optimal line height (1.6)
- Padding: p-4 within code block

**Display States**:
- Empty state: "Select a routine to view XML"
- Loading state: Skeleton or spinner
- Error state: Inline error message

### Status Indicators
- Parse success: Green checkmark with file name
- Parse error: Red warning with error message
- Loading: Spinner with "Parsing..." text
- File stats: Routines count, Tags count, File size

---

## Information Architecture

**Visual Hierarchy**:
1. File upload/status (top priority)
2. Search inputs (easy access)
3. Data counts (context setting)
4. Scrollable lists (main content)
5. XML viewer (detailed inspection)

**Interaction Flow**:
- Upload → Parse → Browse Lists → Select Routine → View XML
- Search filters apply immediately
- Click routine to load XML in viewer
- No page refreshes, all client-side state

---

## Responsive Behavior

**Breakpoints**:
- Mobile (<768px): Single column, stacked sections with collapsible panels
- Tablet (768px-1024px): Two-column layout (lists side-by-side, viewer below)
- Desktop (>1024px): Three-column layout as specified

**Mobile Optimizations**:
- Collapsible sections with expand/collapse controls
- Sticky section headers
- Full-width XML viewer
- Touch-friendly tap targets (min h-10)

---

## Interaction Patterns

**List Selection**:
- Single-click to select routine
- Visual feedback on hover and selected states
- Keyboard navigation support (arrow keys, enter)

**Search Behavior**:
- Live filtering as user types
- Case-insensitive matching
- Match highlighting in results (optional enhancement)
- Result count updates dynamically

**Error Handling**:
- Invalid file type: Inline error below upload
- Parse errors: Detailed error message with line number if available
- No routines found: Empty state message
- Network/file read errors: Toast or inline notification

---

## Accessibility Requirements

- Semantic HTML structure (nav, main, section)
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels for interactive elements
- Keyboard navigation throughout
- Focus visible states on all interactive elements
- Screen reader friendly list announcements
- Error messages associated with inputs

---

## Performance Considerations

**Rendering Strategy**:
- Virtual scrolling for lists >100 items
- Lazy render XML viewer (only when routine selected)
- Debounce search input (300ms)
- Memoize parsed data to prevent re-parsing

**Visual Loading States**:
- Skeleton screens for initial load
- Inline spinners for routine XML loading
- Progress indication for large files

---

## Critical Design Constraints

1. **No Viewport Forcing**: Let content determine height naturally with proper scroll containers
2. **Fixed Heights for Lists**: Constrain list containers (not entire sections) to prevent layout shift
3. **Preserve XML Formatting**: Use `white-space: pre` for XML viewer to maintain indentation
4. **Monospace Consistency**: All code/XML must use monospace font
5. **Clear Visual Separation**: Distinct boundaries between panels with proper spacing
6. **Minimal Animations**: Only use for loading states and hover feedback - no decorative motion

---

## Images

**No images required** - This is a data-focused developer tool where visual assets would detract from functionality. The interface should be clean, text-based, and optimized for information density.