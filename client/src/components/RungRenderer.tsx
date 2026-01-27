import { type RungElement } from "@/utils/rllParser";

export interface InstructionClickData {
  type: string;
  tag?: string;
  source?: string;
  dest?: string;
  preset?: string;
  accum?: string;
  index: number;
  rungNumber: number;
}

interface RungRendererProps {
  parsed: RungElement[];
  rungNumber: number;
  isSelected?: boolean;
  onClick?: () => void;
  onInstructionClick?: (data: InstructionClickData) => void;
}

const GRID_SIZE = 100;
const RAIL_HEIGHT = 45;
const INSTRUCTION_WIDTH = 70;
const INSTRUCTION_HEIGHT = 30;
const BRANCH_SPACING = 60;

export function RungRenderer({ parsed, rungNumber, isSelected = false, onClick, onInstructionClick }: RungRendererProps) {
  let xPosition = 40; // Start with offset for left margin
  const elements: JSX.Element[] = [];
  let maxY = RAIL_HEIGHT;
  let instructionIndex = 0;

  function handleInstructionClick(e: React.MouseEvent, instruction: any, index: number) {
    e.stopPropagation();
    if (onInstructionClick) {
      onInstructionClick({
        type: instruction.type,
        tag: instruction.tag,
        source: instruction.source,
        dest: instruction.dest,
        preset: instruction.preset,
        accum: instruction.accum,
        index,
        rungNumber,
      });
    }
  }

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
    const currentIndex = instructionIndex++;
    const key = `inst-${x}-${y}-${instruction.type}-${currentIndex}`;

    // Draw horizontal line to instruction
    elements.push(
      <line
        key={`line-to-${key}`}
        x1={x}
        y1={y}
        x2={x + 30}
        y2={y}
        stroke="currentColor"
        strokeWidth="2"
      />
    );

    // Draw instruction based on type
    if (instruction.type === "XIC") {
      // XIC: Normally open contact | |
      const centerX = x + 37.5;
      elements.push(
        <g 
          key={key}
          className={onInstructionClick ? "cursor-pointer hover:opacity-70" : ""}
          onClick={(e) => handleInstructionClick(e, instruction, currentIndex)}
          data-testid={`instruction-${instruction.type}-${currentIndex}`}
        >
          <rect x={x + 25} y={y - 35} width={25} height={55} fill="transparent" />
          <line x1={x + 30} y1={y - 15} x2={x + 30} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 45} y1={y - 15} x2={x + 45} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <text x={centerX} y={y - 25} textAnchor="middle" fontSize="11" fill="currentColor" className="font-mono">
            {instruction.tag}
          </text>
        </g>
      );
    } else if (instruction.type === "XIO") {
      // XIO: Normally closed contact |/|
      const centerX = x + 37.5;
      elements.push(
        <g 
          key={key}
          className={onInstructionClick ? "cursor-pointer hover:opacity-70" : ""}
          onClick={(e) => handleInstructionClick(e, instruction, currentIndex)}
          data-testid={`instruction-${instruction.type}-${currentIndex}`}
        >
          <rect x={x + 25} y={y - 35} width={25} height={55} fill="transparent" />
          <line x1={x + 30} y1={y - 15} x2={x + 30} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 45} y1={y - 15} x2={x + 45} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 30} y1={y + 15} x2={x + 45} y2={y - 15} stroke="currentColor" strokeWidth="2" />
          <text x={centerX} y={y - 25} textAnchor="middle" fontSize="11" fill="currentColor" className="font-mono">
            {instruction.tag}
          </text>
        </g>
      );
    } else if (instruction.type === "OTE") {
      // OTE: Output energize ( )
      const centerX = x + 37.5;
      elements.push(
        <g 
          key={key}
          className={onInstructionClick ? "cursor-pointer hover:opacity-70" : ""}
          onClick={(e) => handleInstructionClick(e, instruction, currentIndex)}
          data-testid={`instruction-${instruction.type}-${currentIndex}`}
        >
          <rect x={x + 25} y={y - 35} width={25} height={55} fill="transparent" />
          <line x1={x + 30} y1={y - 15} x2={x + 30} y2={y - 10} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 30} y1={y + 10} x2={x + 30} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 45} y1={y - 15} x2={x + 45} y2={y - 10} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 45} y1={y + 10} x2={x + 45} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <circle cx={centerX} cy={y} r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <text x={centerX} y={y - 25} textAnchor="middle" fontSize="11" fill="currentColor" className="font-mono">
            {instruction.tag}
          </text>
        </g>
      );
    } else if (instruction.type === "OTL") {
      // OTL: Output latch (L)
      const centerX = x + 37.5;
      elements.push(
        <g 
          key={key}
          className={onInstructionClick ? "cursor-pointer hover:opacity-70" : ""}
          onClick={(e) => handleInstructionClick(e, instruction, currentIndex)}
          data-testid={`instruction-${instruction.type}-${currentIndex}`}
        >
          <rect x={x + 25} y={y - 35} width={25} height={55} fill="transparent" />
          <line x1={x + 30} y1={y - 15} x2={x + 30} y2={y - 10} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 30} y1={y + 10} x2={x + 30} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 45} y1={y - 15} x2={x + 45} y2={y - 10} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 45} y1={y + 10} x2={x + 45} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <circle cx={centerX} cy={y} r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <text x={centerX} y={y + 4} textAnchor="middle" fontSize="11" fill="currentColor" className="font-bold">
            L
          </text>
          <text x={centerX} y={y - 25} textAnchor="middle" fontSize="11" fill="currentColor" className="font-mono">
            {instruction.tag}
          </text>
        </g>
      );
    } else if (instruction.type === "OTU") {
      // OTU: Output unlatch (U)
      const centerX = x + 37.5;
      elements.push(
        <g 
          key={key}
          className={onInstructionClick ? "cursor-pointer hover:opacity-70" : ""}
          onClick={(e) => handleInstructionClick(e, instruction, currentIndex)}
          data-testid={`instruction-${instruction.type}-${currentIndex}`}
        >
          <rect x={x + 25} y={y - 35} width={25} height={55} fill="transparent" />
          <line x1={x + 30} y1={y - 15} x2={x + 30} y2={y - 10} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 30} y1={y + 10} x2={x + 30} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 45} y1={y - 15} x2={x + 45} y2={y - 10} stroke="currentColor" strokeWidth="2" />
          <line x1={x + 45} y1={y + 10} x2={x + 45} y2={y + 15} stroke="currentColor" strokeWidth="2" />
          <circle cx={centerX} cy={y} r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <text x={centerX} y={y + 4} textAnchor="middle" fontSize="11" fill="currentColor" className="font-bold">
            U
          </text>
          <text x={centerX} y={y - 25} textAnchor="middle" fontSize="11" fill="currentColor" className="font-mono">
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
        <g 
          key={key}
          className={onInstructionClick ? "cursor-pointer hover:opacity-70" : ""}
          onClick={(e) => handleInstructionClick(e, instruction, currentIndex)}
          data-testid={`instruction-${instruction.type}-${currentIndex}`}
        >
          <rect
            x={x + 30}
            y={y - 25}
            width={80}
            height={50}
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="pointer-events-auto"
          />
          <text x={x + 70} y={y - 8} textAnchor="middle" fontSize="12" fill="currentColor" className="font-bold">
            {label}
          </text>
          <text x={x + 70} y={y + 6} textAnchor="middle" fontSize="11" fill="currentColor" className="font-mono">
            {source}
          </text>
          <text x={x + 70} y={y + 18} textAnchor="middle" fontSize="11" fill="currentColor" className="font-mono">
            {dest}
          </text>
        </g>
      );
      
      // Line after box
      elements.push(
        <line
          key={`line-after-${key}`}
          x1={x + 110}
          y1={y}
          x2={x + GRID_SIZE}
          y2={y}
          stroke="currentColor"
          strokeWidth="2"
        />
      );
      
      xPosition += GRID_SIZE;
      return { width: GRID_SIZE, height: 50 };
    } else {
      // Generic instruction - draw as a box
      elements.push(
        <g 
          key={key}
          className={onInstructionClick ? "cursor-pointer hover:opacity-70" : ""}
          onClick={(e) => handleInstructionClick(e, instruction, currentIndex)}
          data-testid={`instruction-${instruction.type}-${currentIndex}`}
        >
          <rect
            x={x + 20}
            y={y - 15}
            width={INSTRUCTION_WIDTH}
            height={INSTRUCTION_HEIGHT}
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="pointer-events-auto"
          />
          <text x={x + 45} y={y + 5} textAnchor="middle" fontSize="11" fill="currentColor" className="font-bold">
            {instruction.type}
          </text>
          {instruction.tag && (
            <text x={x + 45} y={y - 25} textAnchor="middle" fontSize="10" fill="currentColor" className="font-mono">
              {instruction.tag}
            </text>
          )}
        </g>
      );
    }

    // Draw line after instruction
    elements.push(
      <line
        key={`line-after-${key}`}
        x1={x + 45}
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

  const totalWidth = xPosition + 50;
  const totalHeight = Math.max(maxY + 30, 80);

  return (
    <div 
      className={`border rounded-md p-2 bg-background transition-colors cursor-pointer hover-elevate ${
        isSelected 
          ? 'border-primary bg-primary/5' 
          : 'border-border'
      }`}
      onClick={onClick}
      data-testid={`rung-${rungNumber}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-[10px] font-semibold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
          {rungNumber}
        </span>
        {isSelected && (
          <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
            Editing
          </span>
        )}
        {parsed.length === 0 && (
          <span className="text-[10px] text-muted-foreground italic">
            (empty)
          </span>
        )}
      </div>
      <svg width={totalWidth} height={totalHeight} className="text-foreground overflow-visible">
        {/* Left rail */}
        <line
          x1="20"
          y1="10"
          x2="20"
          y2={totalHeight - 10}
          stroke="currentColor"
          strokeWidth="3"
        />
        
        {/* Right rail */}
        <line
          x1={totalWidth - 20}
          y1="10"
          x2={totalWidth - 20}
          y2={totalHeight - 10}
          stroke="currentColor"
          strokeWidth="3"
        />
        
        {/* Rung horizontal line from left rail */}
        <line
          x1="20"
          y1={RAIL_HEIGHT}
          x2="40"
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
