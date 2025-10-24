export interface Instruction {
  type: string;
  tag?: string;
  operand?: string;
  [key: string]: any;
}

export interface Branch {
  type: "Branch";
  branches: Instruction[][];
}

export type RungElement = Instruction | Branch;

export function parseRung(rungText: string): RungElement[] {
  // Remove trailing semicolon and whitespace
  const text = rungText.trim().replace(/;$/, '');
  
  const result: RungElement[] = [];
  let index = 0;

  function parseElements(endChar?: string): RungElement[] {
    const elements: RungElement[] = [];

    while (index < text.length) {
      const char = text[index];

      // Check for end of current context
      if (endChar && char === endChar) {
        return elements;
      }

      // Handle branches
      if (char === '[') {
        index++; // Skip '['
        const branch = parseBranch();
        elements.push(branch);
        continue;
      }

      // Handle instructions
      const instruction = parseInstruction();
      if (instruction) {
        elements.push(instruction);
      } else {
        index++; // Skip unknown character
      }
    }

    return elements;
  }

  function parseBranch(): Branch {
    const branches: Instruction[][] = [];
    let currentBranch: Instruction[] = [];

    while (index < text.length) {
      const char = text[index];

      if (char === ']') {
        // End of branch
        if (currentBranch.length > 0) {
          branches.push(currentBranch);
        }
        index++; // Skip ']'
        break;
      } else if (char === ',') {
        // New parallel branch
        if (currentBranch.length > 0) {
          branches.push(currentBranch);
        }
        currentBranch = [];
        index++; // Skip ','
      } else if (char === '[') {
        // Nested branch
        index++; // Skip '['
        const nestedBranch = parseBranch();
        currentBranch.push(nestedBranch);
      } else {
        // Parse instruction
        const instruction = parseInstruction();
        if (instruction) {
          currentBranch.push(instruction);
        } else {
          index++; // Skip unknown character
        }
      }
    }

    return {
      type: "Branch",
      branches: branches
    };
  }

  function parseInstruction(): Instruction | null {
    // Skip whitespace
    while (index < text.length && /\s/.test(text[index])) {
      index++;
    }

    if (index >= text.length) return null;

    // Try to match instruction pattern: INSTRUCTION(operand)
    const match = text.slice(index).match(/^([A-Z]+)\(([^)]*)\)/);
    
    if (match) {
      const instructionType = match[1];
      const operand = match[2];
      index += match[0].length;

      return {
        type: instructionType,
        tag: operand
      };
    }

    return null;
  }

  return parseElements();
}

export function extractRungs(routineXML: string): Array<{ number: number; text: string }> {
  const rungs: Array<{ number: number; text: string }> = [];
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(routineXML, 'text/xml');
    
    // Check for parse errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      return rungs;
    }

    // Find RLLContent section
    const rllContent = xmlDoc.querySelector('RLLContent');
    if (!rllContent) {
      return rungs;
    }

    // Extract all rungs
    const rungElements = rllContent.querySelectorAll('Rung');
    rungElements.forEach((rung, index) => {
      const textElement = rung.querySelector('Text');
      if (textElement && textElement.textContent) {
        // Get the rung number from the Number attribute, fallback to index
        const numberAttr = rung.getAttribute('Number');
        const rungNumber = numberAttr ? parseInt(numberAttr, 10) : index;
        
        rungs.push({
          number: rungNumber,
          text: textElement.textContent.trim()
        });
      }
    });
  } catch (error) {
    console.error('Error extracting rungs:', error);
  }

  return rungs;
}
