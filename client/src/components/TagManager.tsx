import { useState } from "react";
import { Plus, Edit2, Trash2, Tag, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TagData {
  name: string;
  dataType: string;
  scope: "controller" | "program";
  programName?: string;
}

interface TagManagerProps {
  controllerTags: string[];
  programs: Array<{ name: string; tags: string[] }>;
  onAddTag: (tag: TagData) => void;
  onEditTag: (oldName: string, newTag: TagData) => void;
  onDeleteTag: (tagName: string, scope: "controller" | "program", programName?: string) => void;
  disabled?: boolean;
}

const DATA_TYPES = [
  { value: "BOOL", label: "BOOL - Boolean" },
  { value: "SINT", label: "SINT - Short Integer (8-bit)" },
  { value: "INT", label: "INT - Integer (16-bit)" },
  { value: "DINT", label: "DINT - Double Integer (32-bit)" },
  { value: "LINT", label: "LINT - Long Integer (64-bit)" },
  { value: "REAL", label: "REAL - Floating Point (32-bit)" },
  { value: "LREAL", label: "LREAL - Long Real (64-bit)" },
  { value: "STRING", label: "STRING - Text String" },
  { value: "TIMER", label: "TIMER - Timer Structure" },
  { value: "COUNTER", label: "COUNTER - Counter Structure" },
];

export function TagManager({
  controllerTags,
  programs,
  onAddTag,
  onEditTag,
  onDeleteTag,
  disabled = false,
}: TagManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  
  const [newTagName, setNewTagName] = useState("");
  const [newTagDataType, setNewTagDataType] = useState("BOOL");
  const [newTagScope, setNewTagScope] = useState<"controller" | "program">("controller");
  const [newTagProgram, setNewTagProgram] = useState(programs[0]?.name || "");

  const openAddDialog = () => {
    setEditingTag(null);
    setNewTagName("");
    setNewTagDataType("BOOL");
    setNewTagScope("controller");
    setNewTagProgram(programs[0]?.name || "");
    setDialogOpen(true);
  };

  const openEditDialog = (tagName: string, scope: "controller" | "program", programName?: string) => {
    setEditingTag({ name: tagName, dataType: "BOOL", scope, programName });
    setNewTagName(tagName);
    setNewTagDataType("BOOL");
    setNewTagScope(scope);
    setNewTagProgram(programName || programs[0]?.name || "");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!newTagName.trim()) return;
    
    const tagData: TagData = {
      name: newTagName.trim(),
      dataType: newTagDataType,
      scope: newTagScope,
      programName: newTagScope === "program" ? newTagProgram : undefined,
    };
    
    if (editingTag) {
      onEditTag(editingTag.name, tagData);
    } else {
      onAddTag(tagData);
    }
    
    setDialogOpen(false);
  };

  const handleDelete = (tagName: string, scope: "controller" | "program", programName?: string) => {
    onDeleteTag(tagName, scope, programName);
  };

  const filteredControllerTags = controllerTags.filter(tag =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrograms = programs.map(program => ({
    ...program,
    tags: program.tags.filter(tag =>
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(program => program.tags.length > 0 || searchQuery === "");

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 text-xs pl-7"
              data-testid="input-search-tags"
            />
          </div>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={openAddDialog}
            disabled={disabled}
            data-testid="button-add-tag"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Tag className="w-3 h-3" />
              Controller Tags ({filteredControllerTags.length})
            </div>
            {filteredControllerTags.length === 0 ? (
              <div className="text-xs text-muted-foreground italic pl-5">No tags</div>
            ) : (
              <div className="space-y-0.5">
                {filteredControllerTags.map((tag) => (
                  <div
                    key={`controller-${tag}`}
                    className="flex items-center justify-between group text-xs px-2 py-1 rounded hover:bg-muted/50"
                    data-testid={`tag-controller-${tag}`}
                  >
                    <span className="font-mono truncate">{tag}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => openEditDialog(tag, "controller")}
                        disabled={disabled}
                        data-testid={`button-edit-tag-${tag}`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(tag, "controller")}
                        disabled={disabled}
                        data-testid={`button-delete-tag-${tag}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {filteredPrograms.map((program) => (
            <div key={program.name} className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Tag className="w-3 h-3" />
                {program.name} Tags ({program.tags.length})
              </div>
              {program.tags.length === 0 ? (
                <div className="text-xs text-muted-foreground italic pl-5">No tags</div>
              ) : (
                <div className="space-y-0.5">
                  {program.tags.map((tag) => (
                    <div
                      key={`${program.name}-${tag}`}
                      className="flex items-center justify-between group text-xs px-2 py-1 rounded hover:bg-muted/50"
                      data-testid={`tag-${program.name}-${tag}`}
                    >
                      <span className="font-mono truncate">{tag}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => openEditDialog(tag, "program", program.name)}
                          disabled={disabled}
                          data-testid={`button-edit-tag-${program.name}-${tag}`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(tag, "program", program.name)}
                          disabled={disabled}
                          data-testid={`button-delete-tag-${program.name}-${tag}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit Tag" : "Add New Tag"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-3">
            <div className="space-y-1">
              <Label htmlFor="tagName" className="text-xs">Tag Name</Label>
              <Input
                id="tagName"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
                className="h-8 text-sm font-mono"
                data-testid="input-tag-name"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="dataType" className="text-xs">Data Type</Label>
              <Select value={newTagDataType} onValueChange={setNewTagDataType}>
                <SelectTrigger className="h-8 text-sm" data-testid="select-data-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATA_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="scope" className="text-xs">Scope</Label>
              <Select value={newTagScope} onValueChange={(v) => setNewTagScope(v as "controller" | "program")}>
                <SelectTrigger className="h-8 text-sm" data-testid="select-scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="controller">Controller (Global)</SelectItem>
                  <SelectItem value="program">Program (Local)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newTagScope === "program" && programs.length > 0 && (
              <div className="space-y-1">
                <Label htmlFor="program" className="text-xs">Program</Label>
                <Select value={newTagProgram} onValueChange={setNewTagProgram}>
                  <SelectTrigger className="h-8 text-sm" data-testid="select-program">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="pt-2">
              <Badge variant="secondary" className="text-xs">
                Preview: {newTagName || "TagName"} : {newTagDataType}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              data-testid="button-cancel-tag"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!newTagName.trim()}
              data-testid="button-save-tag"
            >
              {editingTag ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
