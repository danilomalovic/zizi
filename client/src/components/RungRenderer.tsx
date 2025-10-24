import { type RungElement } from "@/utils/rllParser";

interface RungRendererProps {
  parsed: RungElement[];
  rungNumber: number;
}

const GRID_SIZE = 60;
const RAIL_HEIGHT = 40;
const INSTRUCTION_WIDTH = 50;
const INSTRUCTION_HEIGHT = 30;
const BRANCH_SPACING = 50;

export function RungRenderer({ parsed, rungNumber }: RungRendererProps) {
  let xPosition = 0;
  const elements: JSX.Element[] = [];
  let maxY = RAIL_HEIGHT;

  function renderElement(element: RungElement, yOffset: number = 0): { width: number; height: number } {
    if (element.type === "Branch") {
      return renderBranch(element, yOffset);
    } else {
      return renderInstruction(element, yOffset);
    }
  }

  function renderInstruction(instruction: any, yOffset: number): { width: number; height: number } {
    const x = xPosition;
    const y = RAIL_HEIGHT + yOffset;
    const key = `inst-${x}-${y}-${instruction.type}`;

    // Draw horizontal line to instruction
    elements.push(
      <line
        key={`line-to-${key}`}
        x1={x}
        y1={y}
        x2={x + 20}
        y2={y}
        stroke="currentColor"
        strokeWidth="2"
      />
    );

    // Draw instruction based on type
    if (instruction.type === "XIC") {
      // XIC: Normally open contact | |
      elements.push(
        <g key={key}>
          <line x1={x + 20} y1={y - 15} x2={x + 20} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 30} y1={y - 15} x2={x + 30} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <text x={x + 25} y={y - 20} textAnchor="middle" fontSize="11" fill="currentColor" className="font-mono">
            {instruction.tag}
          </text>
        </g>
      );
    } else if (instruction.type === "XIO") {
      // XIO: Normally closed contact |/|
      elements.push(
        <g key={key}>
          <line x1={x + 20} y1={y - 15} x2={x + 20} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 30} y1={y - 15} x2={x + 30} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 20} y1={y + 15} x2={x + 30} y2={y - 15} stroke="currentColor" strokeWidth="2" />
          <text x={x + 25} y={y - 20} textAnchor="middle" fontSize="11" fill="currentColor" className="font-mono">
            {instruction.tag}
          </text>
        </g>
      );
    } else if (instruction.type === "OTE") {
      // OTE: Output energize ( )
      elements.push(
        <g key={key}>
          <line x1={x + 20} y1={y - 15} x2={x + 20} y2={y - 8} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 20} y1={y + 8} x2={x + 20} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 30} y1={y - 15} x2={x + 30} y2={y - 8} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 30} y1={y + 8} x2={x + 30} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <circle cx={x + 25} cy={y} r="8" stroke="currentColor" strokeWidth="2" fill="none" />
          <text x={x + 25} y={y - 20} textAnchor="middle" fontSize="11" fill="currentColor" className="font-mono">
            {instruction.tag}
          </text>
        </g>
      );
    } else if (instruction.type === "OTL") {
      // OTL: Output latch (L)
      elements.push(
        <g key={key}>
          <line x1={x + 20} y1={y - 15} x2={x + 20} y2={y - 8} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 20} y1={y + 8} x2={x + 20} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 30} y1={y - 15} x2={x + 30} y2={y - 8} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 30} y1={y + 8} x2={x + 30} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <circle cx={x + 25} cy={y} r="8" stroke="currentColor" strokeWidth="2" fill="none" />
          <text x={x + 25} y={y + 3} textAnchor="middle" fontSize="10" fill="currentColor" className="font-bold">
            L
          </text>
          <text x={x + 25} y={y - 20} textAnchor="middle" fontSize="11" fill="currentColor" className="font-mono">
            {instruction.tag}
          </text>
        </g>
      );
    } else if (instruction.type === "OTU") {
      // OTU: Output unlatch (U)
      elements.push(
        <g key={key}>
          <line x1={x + 20} y1={y - 15} x2={x + 20} y2={y - 8} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 20} y1={y + 8} x2={x + 20} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 30} y1={y - 15} x2={x + 30} y2={y - 8} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 30} y1={y + 8} x2={x + 30} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <circle cx={x + 25} cy={y} r="8" stroke="currentColor" strokeWidth="2" fill="none" />
          <text x={x + 25} y={y + 3} textAnchor="middle" fontSize="10" fill="currentColor" className="font-bold">
            U
          </text>
          <text x={x + 25} y={y - 20} textAnchor="middle" fontSize="11" fill="currentColor" className="font-mono">
            {instruction.tag}
          </text>
        </g>
      );
    } else if (instruction.type === "MOV" || instruction.type === "ADD" || instruction.type === "SUB" || instruction.type === "MUL" || instruction.type === "DIV") {
      // Box-style instruction with source and dest
      const label = instruction.type;
      const source = instruction.source || "";
      const dest = instruction.dest || "";
      
      elements.push(
        <g key={key}>
          <rect
            x={x + 20}
            y={y - 20}
            width={60}
            height={40}
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <text x={x + 50} y={y - 5} textAnchor="middle" fontSize="11" fill="currentColor" className="font-bold">
            {label}
          </text>
          <text x={x + 50} y={y + 8} textAnchor="middle" fontSize="9" fill="currentColor" className="font-mono">
            {source}
          </text>
          <text x={x + 50} y={y + 18} textAnchor="middle" fontSize="9" fill="currentColor" className="font-mono">
            {dest}
          </text>
        </g>
      );
      
      // Line after box
      elements.push(
        <line
          key={`line-after-${key}`}
          x1={x + 80}
          y1={y}
          x2={x + 100}
          y2={y}
          stroke="currentColor"
          strokeWidth="2"
        />
      );
      
      xPosition += 100;
      return { width: 100, height: 40 };
    } else {
      // Generic instruction - draw as a box
      elements.push(
        <g key={key}>
          <rect
            x={x + 20}
            y={y - 15}
            width={INSTRUCTION_WIDTH}
            height={INSTRUCTION_HEIGHT}
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <text x={x + 45} y={y + 5} textAnchor="middle" fontSize="11" fill="currentColor" className="font-bold">
            {instruction.type}
          </text>
        </g>
      );
    }

    // Draw line after instruction
    elements.push(
      <line
        key={`line-after-${key}`}
        x1={x + 30}
        y1={y}
        x2={x + GRID_SIZE}
        y2={y}
        stroke="currentColor"
        strokeWidth="2"
      />
    );

    xPosition += GRID_SIZE;
    return { width: GRID_SIZE, height: INSTRUCTION_HEIGHT };
  }

  function renderBranch(branch: any, yOffset: number): { width: number; height: number } {
    const startX = xPosition;
    const startY = RAIL_HEIGHT + yOffset;
    const numBranches = branch.branches.length;
    
    // Draw initial vertical split
    const branchHeight = numBranches * BRANCH_SPACING;
    elements.push(
      <line
        key={`branch-start-${startX}`}
        x1={startX}
        y1={startY}
        x2={startX + 20}
        y2={startY}
        stroke="currentColor"
        strokeWidth="2"
      />
    );

    let maxBranchWidth = 0;
    const branchEndPositions: number[] = [];
    
    // Draw each parallel branch
    branch.branches.forEach((branchElements: RungElement[], index: number) => {
      const branchY = startY - (branchHeight / 2) + (index * BRANCH_SPACING) + (BRANCH_SPACING / 2);
      
      // Vertical line to branch
      elements.push(
        <line
          key={`branch-vert-${startX}-${index}`}
          x1={startX + 20}
          y1={startY}
          x2={startX + 20}
          y2={branchY}
          stroke="currentColor"
          strokeWidth="2"
        />
      );

      // Draw horizontal line for this branch
      elements.push(
        <line
          key={`branch-horiz-${startX}-${index}`}
          x1={startX + 20}
          y1={branchY}
          x2={startX + 40}
          y2={branchY}
          stroke="currentColor"
          strokeWidth="2"
        />
      );

      // Draw elements in this branch
      xPosition = startX + 40;
      branchElements.forEach((element) => {
        const offset = branchY - startY;
        renderElement(element, offset);
      });

      // Store where this branch ended
      branchEndPositions[index] = xPosition;
      
      const branchWidth = xPosition - (startX + 40);
      if (branchWidth > maxBranchWidth) {
        maxBranchWidth = branchWidth;
      }
    });

    // Calculate merge point
    const mergeX = startX + 40 + maxBranchWidth;
    
    // Draw merge lines for each branch
    branch.branches.forEach((branchElements: RungElement[], index: number) => {
      const branchY = startY - (branchHeight / 2) + (index * BRANCH_SPACING) + (BRANCH_SPACING / 2);
      const branchEndX = branchEndPositions[index];
      
      // Draw horizontal line from branch end to merge point
      elements.push(
        <line
          key={`branch-merge-horiz-${startX}-${index}`}
          x1={branchEndX}
          y1={branchY}
          x2={mergeX + 20}
          y2={branchY}
          stroke="currentColor"
          strokeWidth="2"
        />
      );
      
      // Draw vertical line from branch to main rung level
      elements.push(
        <line
          key={`branch-merge-vert-${startX}-${index}`}
          x1={mergeX + 20}
          y1={branchY}
          x2={mergeX + 20}
          y2={startY}
          stroke="currentColor"
          strokeWidth="2"
        />
      );
    });

    // Final horizontal line after merge
    elements.push(
      <line
        key={`branch-end-${startX}`}
        x1={mergeX + 20}
        y1={startY}
        x2={mergeX + 40}
        y2={startY}
        stroke="currentColor"
        strokeWidth="2"
      />
    );

    xPosition = mergeX + 40;
    maxY = Math.max(maxY, startY + branchHeight / 2 + 20);
    
    return { width: mergeX + 40 - startX, height: branchHeight + 40 };
  }

  // Render all elements
  parsed.forEach((element) => {
    renderElement(element, 0);
  });

  const totalWidth = xPosition + 60;
  const totalHeight = maxY + 40;

  return (
    <div className="border border-border rounded-md p-4 bg-background">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-muted-foreground">Rung {rungNumber}</span>
      </div>
      <svg width={totalWidth} height={totalHeight} className="text-foreground">
        {/* Left rail */}
        <line
          x1="0"
          y1="0"
          x2="0"
          y2={totalHeight}
          stroke="currentColor"
          strokeWidth="3"
        />
        
        {/* Right rail */}
        <line
          x1={totalWidth - 20}
          y1="0"
          x2={totalWidth - 20}
          y2={totalHeight}
          stroke="currentColor"
          strokeWidth="3"
        />
        
        {/* Rung horizontal line from left rail */}
        <line
          x1="0"
          y1={RAIL_HEIGHT}
          x2="20"
          y2={RAIL_HEIGHT}
          stroke="currentColor"
          strokeWidth="2"
        />
        
        {/* Rung horizontal line to right rail */}
        <line
          x1={xPosition}
          y1={RAIL_HEIGHT}
          x2={totalWidth - 20}
          y2={RAIL_HEIGHT}
          stroke="currentColor"
          strokeWidth="2"
        />
        
        {/* Render all elements */}
        {elements}
      </svg>
    </div>
  );
}
