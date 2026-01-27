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

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  itemType: "program" | "routine" | "controller";
  onConfirm: (newName: string) => void;
}

export function RenameDialog({ open, onOpenChange, currentName, itemType, onConfirm }: RenameDialogProps) {
  const [newName, setNewName] = useState(currentName);

  useEffect(() => {
    if (open) {
      setNewName(currentName);
    }
  }, [open, currentName]);

  const handleSubmit = () => {
    if (newName.trim() && newName.trim() !== currentName) {
      onConfirm(newName.trim());
      onOpenChange(false);
    }
  };

  const isValid = newName.trim() && newName.trim() !== currentName;

  const typeLabel = itemType.charAt(0).toUpperCase() + itemType.slice(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Rename {typeLabel}</DialogTitle>
          <DialogDescription>
            Enter a new name for "{currentName}"
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="newName">New Name</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`Enter new ${itemType} name`}
              data-testid="input-rename"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-rename"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            data-testid="button-confirm-rename"
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
