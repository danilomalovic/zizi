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

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (controllerName: string, programName: string, routineName: string) => void;
}

export function NewProjectDialog({ open, onOpenChange, onConfirm }: NewProjectDialogProps) {
  const [controllerName, setControllerName] = useState("MainController");
  const [programName, setProgramName] = useState("MainProgram");
  const [routineName, setRoutineName] = useState("MainRoutine");

  const handleSubmit = () => {
    if (controllerName.trim() && programName.trim() && routineName.trim()) {
      onConfirm(controllerName.trim(), programName.trim(), routineName.trim());
      onOpenChange(false);
      setControllerName("MainController");
      setProgramName("MainProgram");
      setRoutineName("MainRoutine");
    }
  };

  const isValid = controllerName.trim() && programName.trim() && routineName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Start a new ladder logic project from scratch
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="controllerName">Controller Name</Label>
            <Input
              id="controllerName"
              value={controllerName}
              onChange={(e) => setControllerName(e.target.value)}
              placeholder="e.g., MainController"
              data-testid="input-controller-name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="programName">Program Name</Label>
            <Input
              id="programName"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g., MainProgram"
              data-testid="input-program-name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="routineName">Initial Routine Name</Label>
            <Input
              id="routineName"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="e.g., MainRoutine"
              data-testid="input-routine-name"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-project"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            data-testid="button-create-project"
          >
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
