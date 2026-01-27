import { useState } from "react";
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

interface NewProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (programName: string, routineName: string) => void;
}

export function NewProgramDialog({ open, onOpenChange, onConfirm }: NewProgramDialogProps) {
  const [programName, setProgramName] = useState("NewProgram");
  const [routineName, setRoutineName] = useState("MainRoutine");

  const handleSubmit = () => {
    if (programName.trim() && routineName.trim()) {
      onConfirm(programName.trim(), routineName.trim());
      onOpenChange(false);
      setProgramName("NewProgram");
      setRoutineName("MainRoutine");
    }
  };

  const isValid = programName.trim() && routineName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create New Program</DialogTitle>
          <DialogDescription>
            Add a new program to the current project
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="programName">Program Name</Label>
            <Input
              id="programName"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g., NewProgram"
              data-testid="input-new-program-name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="routineName">Initial Routine Name</Label>
            <Input
              id="routineName"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="e.g., MainRoutine"
              data-testid="input-initial-routine-name"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-program"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            data-testid="button-create-program"
          >
            Create Program
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
