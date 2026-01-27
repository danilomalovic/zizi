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

interface NewRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (programName: string, routineName: string) => void;
  programs: string[];
}

export function NewRoutineDialog({ open, onOpenChange, onConfirm, programs }: NewRoutineDialogProps) {
  const [selectedProgram, setSelectedProgram] = useState(programs[0] || "");
  const [routineName, setRoutineName] = useState("");
  
  // Sync selectedProgram when programs change or dialog opens
  useEffect(() => {
    if (open && programs.length > 0 && !programs.includes(selectedProgram)) {
      setSelectedProgram(programs[0]);
    }
  }, [open, programs, selectedProgram]);

  const handleSubmit = () => {
    if (selectedProgram && routineName.trim()) {
      onConfirm(selectedProgram, routineName.trim());
      onOpenChange(false);
      setRoutineName("");
    }
  };

  const isValid = selectedProgram && routineName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Routine</DialogTitle>
          <DialogDescription>
            Add a new routine to an existing program
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="program">Program</Label>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger data-testid="select-program">
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program} value={program}>
                    {program}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="routineName">Routine Name</Label>
            <Input
              id="routineName"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="e.g., NewRoutine"
              data-testid="input-new-routine-name"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-routine"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            data-testid="button-create-routine"
          >
            Create Routine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
