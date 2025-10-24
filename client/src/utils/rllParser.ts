export interface Instruction {
  type: string;
  tag?: string;
  source?: string;
  dest?: string;
  [key: string]: any;
}

export interface Branch {
  type: "Branch";
  branches: RungElement[][];
}

export type RungElement = Instruction | Branch;

export function parseRung(rungText: string): RungElement[] {
  // Remove trailing semicolon and whitespace
  const text = rungText.trim().replace(/;$/, '');
  
  let index = 0;

  function parseElements(): RungElement[] {
    const elements: RungElement[] = [];

    while (index < text.length) {
      skipWhitespace();
      
      if (index >= text.length) break;

      const char = text[index];

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
    const branches: RungElement[][] = [];
    let currentBranch: RungElement[] = [];

    while (index < text.length) {
      skipWhitespace();
      
      if (index >= text.length) break;

      const char = text[index];

      if (char === ']') {
        // End of branch - save current branch if it has content
        if (currentBranch.length > 0) {
          branches.push(currentBranch);
        }
        index++; // Skip ']'
        break;
      } else if (char === ',') {
        // Parallel branch separator - save current branch and start new one
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
        // Parse instruction within branch
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
    skipWhitespace();

    if (index >= text.length) return null;

    // Try to match instruction pattern: INSTRUCTION(params)
    const instructionMatch = text.slice(index).match(/^([A-Z_]+)\(/);
    
    if (!instructionMatch) return null;

    const instructionType = instructionMatch[1];
    index += instructionMatch[0].length; // Move past "INSTRUCTION("

    // Parse parameters inside parentheses
    const params = parseParameters();

    // Create instruction object based on type
    if (instructionType === 'MOV' && params.length === 2) {
      return {
        type: instructionType,
        source: params[0],
        dest: params[1]
      };
    } else if (params.length === 1) {
      // Single parameter instructions (XIC, OTE, etc.)
      return {
        type: instructionType,
        tag: params[0]
      };
    } else if (params.length === 2) {
      // Generic two-parameter instruction
      return {
        type: instructionType,
        source: params[0],
        dest: params[1]
      };
    } else {
      // Generic multi-parameter instruction
      return {
        type: instructionType,
        params: params
      };
    }
  }

  function parseParameters(): string[] {
    const params: string[] = [];
    let currentParam = '';
    let depth = 0;

    while (index < text.length) {
      const char = text[index];

      if (char === '(') {
        depth++;
        currentParam += char;
        index++;
      } else if (char === ')') {
        if (depth === 0) {
          // End of parameter list
          if (currentParam.trim()) {
            params.push(currentParam.trim());
          }
          index++; // Skip ')'
          break;
        } else {
          depth--;
          currentParam += char;
          index++;
        }
      } else if (char === ',' && depth === 0) {
        // Parameter separator
        if (currentParam.trim()) {
          params.push(currentParam.trim());
        }
        currentParam = '';
        index++;
      } else {
        currentParam += char;
        index++;
      }
    }

    return params;
  }

  function skipWhitespace() {
    while (index < text.length && /\s/.test(text[index])) {
      index++;
    }
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
