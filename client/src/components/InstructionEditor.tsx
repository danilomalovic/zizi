import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { InstructionDefinition } from "./InstructionPalette";

interface InstructionEditorProps {
  instruction: InstructionDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (instruction: Record<string, string | number>) => void;
  availableTags?: Array<{ name: string; type: string }>;
}

export function InstructionEditor({
  instruction,
  open,
  onOpenChange,
  onConfirm,
  availableTags = [],
}: InstructionEditorProps) {
  const [parameters, setParameters] = useState<Record<string, string>>({});

  useEffect(() => {
    if (instruction) {
      const initialParams: Record<string, string> = {};
      instruction.parameters.forEach((param) => {
        initialParams[param.name] = "";
      });
      setParameters(initialParams);
    }
  }, [instruction]);

  if (!instruction) return null;

  const handleSubmit = () => {
    const instructionData: Record<string, string | number> = {
      type: instruction.type,
    };

    instruction.parameters.forEach((param) => {
      const value = parameters[param.name];
      if (value) {
        if (param.type === "DINT" || param.type === "REAL") {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            instructionData[param.name] = numValue;
          } else {
            instructionData[param.name] = value;
          }
        } else {
          instructionData[param.name] = value;
        }
      }
    });

    onConfirm(instructionData);
    onOpenChange(false);
  };

  const isValid = instruction.parameters
    .filter((p) => p.required)
    .every((p) => parameters[p.name]?.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <code className="text-lg font-mono bg-muted px-2 py-0.5 rounded">
              {instruction.type}
            </code>
            <span className="text-base font-normal text-muted-foreground">
              {instruction.name}
            </span>
          </DialogTitle>
          <DialogDescription>{instruction.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {instruction.parameters.map((param) => (
            <div key={param.name} className="grid gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={param.name} className="text-sm">
                  {param.name}
                </Label>
                <Badge variant="outline" className="text-xs">
                  {param.type}
                </Badge>
                {param.required && (
                  <span className="text-xs text-destructive">*</span>
                )}
              </div>

              {availableTags.length > 0 && param.type === "BOOL" ? (
                <Select
                  value={parameters[param.name]}
                  onValueChange={(value) =>
                    setParameters((prev) => ({ ...prev, [param.name]: value }))
                  }
                >
                  <SelectTrigger data-testid={`select-${param.name}`}>
                    <SelectValue placeholder="Select or type a tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags
                      .filter((t) => t.type === "BOOL" || t.type.includes("BOOL"))
                      .map((tag) => (
                        <SelectItem key={tag.name} value={tag.name}>
                          {tag.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={param.name}
                  value={parameters[param.name]}
                  onChange={(e) =>
                    setParameters((prev) => ({
                      ...prev,
                      [param.name]: e.target.value,
                    }))
                  }
                  placeholder={
                    param.type === "DINT" || param.type === "REAL"
                      ? "Value or tag name"
                      : "Tag name"
                  }
                  data-testid={`input-${param.name}`}
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-instruction"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            data-testid="button-add-instruction"
          >
            Add Instruction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
