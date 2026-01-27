import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type InstructionClickData } from "./RungRenderer";

interface InstructionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instruction: InstructionClickData | null;
  onSave: (instruction: InstructionClickData, updates: Record<string, string>) => void;
  onDelete: (instruction: InstructionClickData) => void;
  availableTags?: string[];
}

const INSTRUCTIONS_WITH_TAG = ["XIC", "XIO", "OTE", "OTL", "OTU", "ONS", "OSR", "OSF"];
const INSTRUCTIONS_WITH_SOURCE_DEST = ["MOV", "ADD", "SUB", "MUL", "DIV", "AND", "OR", "XOR"];
const TIMER_COUNTER_INSTRUCTIONS = ["TON", "TOF", "RTO", "CTU", "CTD", "RES"];

export function InstructionEditDialog({
  open,
  onOpenChange,
  instruction,
  onSave,
  onDelete,
  availableTags = [],
}: InstructionEditDialogProps) {
  const [tag, setTag] = useState("");
  const [source, setSource] = useState("");
  const [dest, setDest] = useState("");
  const [preset, setPreset] = useState("");
  const [accum, setAccum] = useState("");

  useEffect(() => {
    if (instruction) {
      setTag(instruction.tag || "");
      setSource(instruction.source || "");
      setDest(instruction.dest || "");
      setPreset(instruction.preset || "");
      setAccum(instruction.accum || "");
    }
  }, [instruction]);

  if (!instruction) return null;

  const hasTag = INSTRUCTIONS_WITH_TAG.includes(instruction.type);
  const hasSourceDest = INSTRUCTIONS_WITH_SOURCE_DEST.includes(instruction.type);
  const hasTimerCounter = TIMER_COUNTER_INSTRUCTIONS.includes(instruction.type);

  const handleSave = () => {
    const updates: Record<string, string> = {};
    if (hasTag || hasTimerCounter) updates.tag = tag;
    if (hasSourceDest) {
      updates.source = source;
      updates.dest = dest;
    }
    if (hasTimerCounter) {
      updates.preset = preset;
      updates.accum = accum;
    }
    onSave(instruction, updates);
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete(instruction);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit {instruction.type} Instruction
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 py-3">
          <div className="text-xs text-muted-foreground">
            Rung {instruction.rungNumber}, Position {instruction.index + 1}
          </div>

          {hasTag && (
            <div className="space-y-1">
              <Label htmlFor="tag" className="text-xs">Tag Name</Label>
              <Input
                id="tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Enter tag name"
                className="h-8 text-sm"
                list="available-tags"
                data-testid="input-edit-tag"
              />
              {availableTags.length > 0 && (
                <datalist id="available-tags">
                  {availableTags.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              )}
            </div>
          )}

          {hasSourceDest && (
            <>
              <div className="space-y-1">
                <Label htmlFor="source" className="text-xs">Source</Label>
                <Input
                  id="source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Source value or tag"
                  className="h-8 text-sm"
                  data-testid="input-edit-source"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dest" className="text-xs">Destination</Label>
                <Input
                  id="dest"
                  value={dest}
                  onChange={(e) => setDest(e.target.value)}
                  placeholder="Destination tag"
                  className="h-8 text-sm"
                  data-testid="input-edit-dest"
                />
              </div>
            </>
          )}

          {hasTimerCounter && (
            <>
              <div className="space-y-1">
                <Label htmlFor="tag" className="text-xs">Timer/Counter Tag</Label>
                <Input
                  id="tag"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Timer or counter tag"
                  className="h-8 text-sm"
                  list="available-tags"
                  data-testid="input-edit-timer-tag"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="preset" className="text-xs">Preset Value</Label>
                <Input
                  id="preset"
                  value={preset}
                  onChange={(e) => setPreset(e.target.value)}
                  placeholder="e.g., 1000"
                  className="h-8 text-sm"
                  data-testid="input-edit-preset"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="accum" className="text-xs">Accumulator</Label>
                <Input
                  id="accum"
                  value={accum}
                  onChange={(e) => setAccum(e.target.value)}
                  placeholder="e.g., 0"
                  className="h-8 text-sm"
                  data-testid="input-edit-accum"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="mr-auto"
            data-testid="button-delete-instruction"
          >
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-edit"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            data-testid="button-save-instruction"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
