import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, Plus, Zap, Clock, Calculator, ArrowRightLeft, GitCompare, ToggleLeft } from "lucide-react";

export interface InstructionDefinition {
  type: string;
  name: string;
  description: string;
  parameters: { name: string; type: string; required: boolean }[];
  category: string;
}

const INSTRUCTION_CATEGORIES: Record<string, { name: string; icon: any; instructions: InstructionDefinition[] }> = {
  bit: {
    name: "Bit Instructions",
    icon: ToggleLeft,
    instructions: [
      { type: "XIC", name: "Examine If Closed", description: "Checks if bit is ON (1)", parameters: [{ name: "tag", type: "BOOL", required: true }], category: "bit" },
      { type: "XIO", name: "Examine If Open", description: "Checks if bit is OFF (0)", parameters: [{ name: "tag", type: "BOOL", required: true }], category: "bit" },
      { type: "OTE", name: "Output Energize", description: "Sets bit ON when rung is true", parameters: [{ name: "tag", type: "BOOL", required: true }], category: "bit" },
      { type: "OTL", name: "Output Latch", description: "Latches bit ON (retentive)", parameters: [{ name: "tag", type: "BOOL", required: true }], category: "bit" },
      { type: "OTU", name: "Output Unlatch", description: "Unlatches bit OFF", parameters: [{ name: "tag", type: "BOOL", required: true }], category: "bit" },
      { type: "ONS", name: "One Shot", description: "Executes once per false-to-true transition", parameters: [{ name: "storage", type: "BOOL", required: true }], category: "bit" },
      { type: "OSR", name: "One Shot Rising", description: "One shot on rising edge", parameters: [{ name: "storage", type: "BOOL", required: true }, { name: "output", type: "BOOL", required: true }], category: "bit" },
      { type: "OSF", name: "One Shot Falling", description: "One shot on falling edge", parameters: [{ name: "storage", type: "BOOL", required: true }, { name: "output", type: "BOOL", required: true }], category: "bit" },
    ]
  },
  timer: {
    name: "Timer/Counter",
    icon: Clock,
    instructions: [
      { type: "TON", name: "Timer On Delay", description: "Delays turning ON", parameters: [{ name: "timer", type: "TIMER", required: true }, { name: "preset", type: "DINT", required: true }, { name: "accum", type: "DINT", required: false }], category: "timer" },
      { type: "TOF", name: "Timer Off Delay", description: "Delays turning OFF", parameters: [{ name: "timer", type: "TIMER", required: true }, { name: "preset", type: "DINT", required: true }, { name: "accum", type: "DINT", required: false }], category: "timer" },
      { type: "RTO", name: "Retentive Timer On", description: "Retentive on-delay timer", parameters: [{ name: "timer", type: "TIMER", required: true }, { name: "preset", type: "DINT", required: true }, { name: "accum", type: "DINT", required: false }], category: "timer" },
      { type: "CTU", name: "Count Up", description: "Increments counter", parameters: [{ name: "counter", type: "COUNTER", required: true }, { name: "preset", type: "DINT", required: true }, { name: "accum", type: "DINT", required: false }], category: "timer" },
      { type: "CTD", name: "Count Down", description: "Decrements counter", parameters: [{ name: "counter", type: "COUNTER", required: true }, { name: "preset", type: "DINT", required: true }, { name: "accum", type: "DINT", required: false }], category: "timer" },
      { type: "RES", name: "Reset", description: "Resets timer or counter", parameters: [{ name: "structure", type: "TIMER|COUNTER", required: true }], category: "timer" },
    ]
  },
  compare: {
    name: "Compare",
    icon: GitCompare,
    instructions: [
      { type: "EQU", name: "Equal", description: "Tests if A equals B", parameters: [{ name: "sourceA", type: "DINT", required: true }, { name: "sourceB", type: "DINT", required: true }], category: "compare" },
      { type: "NEQ", name: "Not Equal", description: "Tests if A not equal to B", parameters: [{ name: "sourceA", type: "DINT", required: true }, { name: "sourceB", type: "DINT", required: true }], category: "compare" },
      { type: "LES", name: "Less Than", description: "Tests if A less than B", parameters: [{ name: "sourceA", type: "DINT", required: true }, { name: "sourceB", type: "DINT", required: true }], category: "compare" },
      { type: "LEQ", name: "Less Than or Equal", description: "Tests if A <= B", parameters: [{ name: "sourceA", type: "DINT", required: true }, { name: "sourceB", type: "DINT", required: true }], category: "compare" },
      { type: "GRT", name: "Greater Than", description: "Tests if A greater than B", parameters: [{ name: "sourceA", type: "DINT", required: true }, { name: "sourceB", type: "DINT", required: true }], category: "compare" },
      { type: "GEQ", name: "Greater Than or Equal", description: "Tests if A >= B", parameters: [{ name: "sourceA", type: "DINT", required: true }, { name: "sourceB", type: "DINT", required: true }], category: "compare" },
      { type: "LIM", name: "Limit Test", description: "Tests if value within limits", parameters: [{ name: "lowLimit", type: "DINT", required: true }, { name: "test", type: "DINT", required: true }, { name: "highLimit", type: "DINT", required: true }], category: "compare" },
    ]
  },
  math: {
    name: "Math",
    icon: Calculator,
    instructions: [
      { type: "ADD", name: "Add", description: "Adds two values", parameters: [{ name: "sourceA", type: "DINT", required: true }, { name: "sourceB", type: "DINT", required: true }, { name: "dest", type: "DINT", required: true }], category: "math" },
      { type: "SUB", name: "Subtract", description: "Subtracts B from A", parameters: [{ name: "sourceA", type: "DINT", required: true }, { name: "sourceB", type: "DINT", required: true }, { name: "dest", type: "DINT", required: true }], category: "math" },
      { type: "MUL", name: "Multiply", description: "Multiplies two values", parameters: [{ name: "sourceA", type: "DINT", required: true }, { name: "sourceB", type: "DINT", required: true }, { name: "dest", type: "DINT", required: true }], category: "math" },
      { type: "DIV", name: "Divide", description: "Divides A by B", parameters: [{ name: "sourceA", type: "DINT", required: true }, { name: "sourceB", type: "DINT", required: true }, { name: "dest", type: "DINT", required: true }], category: "math" },
      { type: "MOD", name: "Modulo", description: "Returns remainder", parameters: [{ name: "sourceA", type: "DINT", required: true }, { name: "sourceB", type: "DINT", required: true }, { name: "dest", type: "DINT", required: true }], category: "math" },
      { type: "NEG", name: "Negate", description: "Changes sign of value", parameters: [{ name: "source", type: "DINT", required: true }, { name: "dest", type: "DINT", required: true }], category: "math" },
      { type: "ABS", name: "Absolute Value", description: "Returns absolute value", parameters: [{ name: "source", type: "DINT", required: true }, { name: "dest", type: "DINT", required: true }], category: "math" },
      { type: "SQR", name: "Square Root", description: "Calculates square root", parameters: [{ name: "source", type: "REAL", required: true }, { name: "dest", type: "REAL", required: true }], category: "math" },
    ]
  },
  move: {
    name: "Move/Logical",
    icon: ArrowRightLeft,
    instructions: [
      { type: "MOV", name: "Move", description: "Copies value to destination", parameters: [{ name: "source", type: "DINT", required: true }, { name: "dest", type: "DINT", required: true }], category: "move" },
      { type: "MVM", name: "Masked Move", description: "Moves with mask", parameters: [{ name: "source", type: "DINT", required: true }, { name: "mask", type: "DINT", required: true }, { name: "dest", type: "DINT", required: true }], category: "move" },
      { type: "CLR", name: "Clear", description: "Sets value to zero", parameters: [{ name: "dest", type: "DINT", required: true }], category: "move" },
      { type: "BTD", name: "Bit Field Distribute", description: "Moves bits within words", parameters: [{ name: "source", type: "DINT", required: true }, { name: "sourceBit", type: "DINT", required: true }, { name: "dest", type: "DINT", required: true }, { name: "destBit", type: "DINT", required: true }, { name: "length", type: "DINT", required: true }], category: "move" },
      { type: "AND", name: "Bitwise AND", description: "Logical AND operation", parameters: [{ name: "sourceA", type: "DINT", required: true }, { name: "sourceB", type: "DINT", required: true }, { name: "dest", type: "DINT", required: true }], category: "move" },
      { type: "OR", name: "Bitwise OR", description: "Logical OR operation", parameters: [{ name: "sourceA", type: "DINT", required: true }, { name: "sourceB", type: "DINT", required: true }, { name: "dest", type: "DINT", required: true }], category: "move" },
      { type: "XOR", name: "Bitwise XOR", description: "Logical XOR operation", parameters: [{ name: "sourceA", type: "DINT", required: true }, { name: "sourceB", type: "DINT", required: true }, { name: "dest", type: "DINT", required: true }], category: "move" },
      { type: "NOT", name: "Bitwise NOT", description: "Logical NOT operation", parameters: [{ name: "source", type: "DINT", required: true }, { name: "dest", type: "DINT", required: true }], category: "move" },
    ]
  },
  program: {
    name: "Program Control",
    icon: Zap,
    instructions: [
      { type: "JSR", name: "Jump to Subroutine", description: "Calls another routine", parameters: [{ name: "routineName", type: "STRING", required: true }], category: "program" },
      { type: "RET", name: "Return", description: "Returns from subroutine", parameters: [], category: "program" },
      { type: "JMP", name: "Jump to Label", description: "Jumps to label", parameters: [{ name: "label", type: "STRING", required: true }], category: "program" },
      { type: "LBL", name: "Label", description: "Defines jump target", parameters: [{ name: "label", type: "STRING", required: true }], category: "program" },
      { type: "MCR", name: "Master Control Reset", description: "Zone control start/end", parameters: [], category: "program" },
      { type: "AFI", name: "Always False", description: "Always evaluates false", parameters: [], category: "program" },
      { type: "NOP", name: "No Operation", description: "Placeholder instruction", parameters: [], category: "program" },
    ]
  },
};

interface InstructionPaletteProps {
  onAddInstruction: (instruction: InstructionDefinition) => void;
  disabled?: boolean;
}

export function InstructionPalette({ onAddInstruction, disabled = false }: InstructionPaletteProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    bit: true,
    timer: false,
    compare: false,
    math: false,
    move: false,
    program: false,
  });

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-chart-2" />
          <h2 className="text-lg font-semibold text-foreground">Instructions</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Click to add to current routine
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {Object.entries(INSTRUCTION_CATEGORIES).map(([key, category]) => {
            const Icon = category.icon;
            return (
              <Collapsible
                key={key}
                open={openCategories[key]}
                onOpenChange={() => toggleCategory(key)}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-md hover-elevate text-left">
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${openCategories[key] ? 'rotate-90' : ''}`}
                  />
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{category.name}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {category.instructions.length}
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-6 space-y-0.5 py-1">
                    {category.instructions.map((instruction) => (
                      <Button
                        key={instruction.type}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-auto py-1.5 px-2"
                        disabled={disabled}
                        onClick={() => onAddInstruction(instruction)}
                        data-testid={`instruction-${instruction.type.toLowerCase()}`}
                      >
                        <div className="flex flex-col items-start w-full">
                          <div className="flex items-center gap-2 w-full">
                            <code className="text-xs font-mono bg-muted px-1 rounded">
                              {instruction.type}
                            </code>
                            <span className="text-xs text-muted-foreground truncate">
                              {instruction.name}
                            </span>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}

export { INSTRUCTION_CATEGORIES };
