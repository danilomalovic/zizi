import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Download, FileText, CheckCircle2, AlertCircle, Copy, Check, Loader2, ChevronRight, ChevronDown, Plus, FolderPlus, FilePlus, Edit2, Trash2, Undo2, Redo2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useHistory } from "@/hooks/useHistory";
import { parseL5X, type ParsedResult } from "@/utils/parser";
import { downloadL5X } from "@/utils/l5xExporter";
import { RungRenderer, type InstructionClickData } from "@/components/RungRenderer";
import { ChatPanel } from "@/components/ChatPanel";
import { InstructionPalette, type InstructionDefinition } from "@/components/InstructionPalette";
import { InstructionEditor } from "@/components/InstructionEditor";
import { InstructionEditDialog } from "@/components/InstructionEditDialog";
import { TagManager } from "@/components/TagManager";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { NewProgramDialog } from "@/components/NewProgramDialog";
import { NewRoutineDialog } from "@/components/NewRoutineDialog";
import { RenameDialog } from "@/components/RenameDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface TreeNodeProps {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  isClickable?: boolean;
  isSelected?: boolean;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  level?: number;
  actions?: React.ReactNode;
}

function TreeNode({ 
  label, 
  icon, 
  onClick, 
  isClickable = false, 
  isSelected = false,
  children, 
  defaultExpanded = false,
  level = 0,
  actions
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasChildren = !!children;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={`group flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer select-none transition-colors ${
          isSelected 
            ? 'bg-accent text-accent-foreground' 
            : isClickable 
            ? 'hover-elevate active-elevate-2' 
            : 'hover-elevate'
        }`}
        style={{ paddingLeft: `${level * 1.25 + 0.5}rem` }}
        data-testid={`tree-node-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className={`text-sm truncate flex-1 ${isClickable ? 'font-medium text-foreground' : 'text-foreground'}`}>
          {label}
        </span>
        {actions && (
          <span className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            {actions}
          </span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div>
          {children}
        </div>
      )}
    </div>
  );
}

interface TreeViewProps {
  data: ParsedResult;
  onRoutineClick: (programName: string, routineName: string) => void;
  selectedRoutine: { program: string; name: string } | null;
  searchQuery?: string;
  onRenameController?: () => void;
  onRenameProgram?: (programName: string) => void;
  onDeleteProgram?: (programName: string) => void;
  onRenameRoutine?: (programName: string, routineName: string) => void;
  onDeleteRoutine?: (programName: string, routineName: string) => void;
}

function TreeView({ 
  data, 
  onRoutineClick, 
  selectedRoutine,
  searchQuery = "",
  onRenameController,
  onRenameProgram,
  onDeleteProgram,
  onRenameRoutine,
  onDeleteRoutine
}: TreeViewProps) {
  const lowerQuery = searchQuery.toLowerCase();
  const matchesSearch = (text: string) => !searchQuery || text.toLowerCase().includes(lowerQuery);
  const routineMatchesSearch = (routine: typeof data.programs[0]['routines'][0]) => {
    if (matchesSearch(routine.name)) return true;
    // Also search in rung text and instructions
    return routine.rungs.some(rung => 
      rung.text?.toLowerCase().includes(lowerQuery) ||
      rung.parsed?.some((inst: any) => 
        inst.type?.toLowerCase().includes(lowerQuery) ||
        inst.tag?.toLowerCase().includes(lowerQuery)
      )
    );
  };
  
  const filteredControllerTags = data.controllerTags.filter(matchesSearch);
  const filteredPrograms = data.programs
    .map(program => ({
      ...program,
      tags: program.tags.filter(matchesSearch),
      routines: program.routines.filter(routineMatchesSearch)
    }))
    .filter(program => 
      matchesSearch(program.name) || 
      program.tags.length > 0 || 
      program.routines.length > 0
    );

  return (
    <div className="text-sm" data-testid="tree-view">
      {/* Controller Root */}
      <TreeNode 
        label={data.controllerName} 
        icon={<FileText className="w-4 h-4 text-chart-1" />}
        defaultExpanded={true}
        level={0}
        actions={onRenameController && (
          <button
            onClick={onRenameController}
            className="p-0.5 rounded hover:bg-muted"
            data-testid="button-rename-controller"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        )}
      >
        {/* Controller Tags Section */}
        {filteredControllerTags.length > 0 && (
          <TreeNode 
            label="Controller Tags"
            icon={<Badge variant="secondary" className="w-4 h-4 flex items-center justify-center text-[10px] p-0">{filteredControllerTags.length}</Badge>}
            defaultExpanded={!!searchQuery}
            level={1}
          >
            {filteredControllerTags.map((tag, index) => (
              <TreeNode
                key={`controller-tag-${tag}-${index}`}
                label={tag}
                level={2}
              />
            ))}
          </TreeNode>
        )}

        {/* Programs Section */}
        {filteredPrograms.length > 0 && (
        <TreeNode 
          label="Programs"
          icon={<Badge variant="secondary" className="w-4 h-4 flex items-center justify-center text-[10px] p-0">{filteredPrograms.length}</Badge>}
          defaultExpanded={true}
          level={1}
        >
          {filteredPrograms.map((program, pIndex) => (
            <TreeNode
              key={`program-${program.name}-${pIndex}`}
              label={program.name}
              icon={<FileText className="w-4 h-4 text-chart-3" />}
              defaultExpanded={true}
              level={2}
              actions={(onRenameProgram || onDeleteProgram) && (
                <span className="flex gap-0.5">
                  {onRenameProgram && (
                    <button
                      onClick={() => onRenameProgram(program.name)}
                      className="p-0.5 rounded hover:bg-muted"
                      data-testid={`button-rename-program-${program.name}`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  {onDeleteProgram && (
                    <button
                      onClick={() => onDeleteProgram(program.name)}
                      className="p-0.5 rounded hover:bg-muted text-destructive"
                      data-testid={`button-delete-program-${program.name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </span>
              )}
            >
              {/* Program Tags */}
              {program.tags.length > 0 && (
                <TreeNode
                  label="Tags"
                  icon={<Badge variant="secondary" className="w-4 h-4 flex items-center justify-center text-[10px] p-0">{program.tags.length}</Badge>}
                  defaultExpanded={true}
                  level={3}
                >
                  {program.tags.map((tag, tIndex) => (
                    <TreeNode
                      key={`program-tag-${program.name}-${tag}-${tIndex}`}
                      label={tag}
                      level={4}
                    />
                  ))}
                </TreeNode>
              )}

              {/* Program Routines */}
              {program.routines.length > 0 && (
                <TreeNode
                  label="Routines"
                  icon={<Badge variant="secondary" className="w-4 h-4 flex items-center justify-center text-[10px] p-0">{program.routines.length}</Badge>}
                  defaultExpanded={true}
                  level={3}
                >
                  {program.routines.map((routine, rIndex) => (
                    <TreeNode
                      key={`routine-${program.name}-${routine.name}-${rIndex}`}
                      label={routine.name}
                      onClick={() => onRoutineClick(program.name, routine.name)}
                      isClickable={true}
                      isSelected={
                        selectedRoutine?.program === program.name &&
                        selectedRoutine?.name === routine.name
                      }
                      level={4}
                      actions={(onRenameRoutine || onDeleteRoutine) && (
                        <span className="flex gap-0.5">
                          {onRenameRoutine && (
                            <button
                              onClick={() => onRenameRoutine(program.name, routine.name)}
                              className="p-0.5 rounded hover:bg-muted"
                              data-testid={`button-rename-routine-${routine.name}`}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          {onDeleteRoutine && (
                            <button
                              onClick={() => onDeleteRoutine(program.name, routine.name)}
                              className="p-0.5 rounded hover:bg-muted text-destructive"
                              data-testid={`button-delete-routine-${routine.name}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      )}
                    />
                  ))}
                </TreeNode>
              )}
            </TreeNode>
          ))}
        </TreeNode>
        )}
      </TreeNode>
    </div>
  );
}

export default function Home() {
  const { state: parsedData, set: setParsedData, undo, redo, reset: resetParsedData, canUndo, canRedo } = useHistory<ParsedResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  
  
  const [selectedRoutine, setSelectedRoutine] = useState<{ program: string; name: string } | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  const [copied, setCopied] = useState(false);
  
  // Instruction Editor state
  const [selectedInstruction, setSelectedInstruction] = useState<InstructionDefinition | null>(null);
  const [instructionEditorOpen, setInstructionEditorOpen] = useState(false);
  
  // Selected rung for editing (add instructions to this rung)
  const [selectedRungNumber, setSelectedRungNumber] = useState<number | null>(null);
  const [copiedRung, setCopiedRung] = useState<any | null>(null);
  
  // Edit existing instruction state
  const [editingInstruction, setEditingInstruction] = useState<InstructionClickData | null>(null);
  const [instructionEditDialogOpen, setInstructionEditDialogOpen] = useState(false);
  
  // New Project/Routine/Program dialog state
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [newProgramDialogOpen, setNewProgramDialogOpen] = useState(false);
  const [newRoutineDialogOpen, setNewRoutineDialogOpen] = useState(false);
  
  // Rename/Delete dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ type: "program" | "routine" | "controller"; name: string; programName?: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "program" | "routine"; name: string; programName?: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Validate selection when parsedData changes (e.g., after undo/redo)
  useEffect(() => {
    if (!parsedData || !selectedRoutine) return;
    
    // Check if the selected routine still exists
    const program = parsedData.programs.find(p => p.name === selectedRoutine.program);
    const routine = program?.routines.find(r => r.name === selectedRoutine.name);
    
    if (!program || !routine) {
      // Selected routine no longer exists, clear selection
      setSelectedRoutine(null);
      setSelectedRungNumber(null);
    } else if (selectedRungNumber !== null) {
      // Check if selected rung still exists
      const rungExists = routine.rungs.some(r => r.number === selectedRungNumber);
      if (!rungExists) {
        setSelectedRungNumber(null);
      }
    }
  }, [parsedData, selectedRoutine, selectedRungNumber]);
  
  // Reset selection after undo/redo to avoid pointing at non-existent elements
  const handleUndo = useCallback(() => {
    undo();
    setSelectedRungNumber(null);
  }, [undo]);
  
  const handleRedo = useCallback(() => {
    redo();
    setSelectedRungNumber(null);
  }, [redo]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      
      // Check if there's a text selection (don't intercept copy/paste if user is copying text)
      const selection = window.getSelection();
      const hasTextSelection = selection && selection.toString().length > 0;
      
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) handleUndo();
      } 
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) handleRedo();
      }
      // Copy rung: Ctrl+C (only if no text selected and rung is selected)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !hasTextSelection && selectedRungNumber !== null && selectedRoutine && parsedData) {
        e.preventDefault();
        const program = parsedData.programs.find(p => p.name === selectedRoutine.program);
        const routine = program?.routines.find(r => r.name === selectedRoutine.name);
        const rung = routine?.rungs.find(r => r.number === selectedRungNumber);
        if (rung) {
          setCopiedRung({ ...rung });
          toast({ description: `Copied rung ${selectedRungNumber}`, duration: 1000 });
        }
      }
      // Paste rung: Ctrl+V (only if no text selected)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !hasTextSelection && copiedRung && selectedRoutine && parsedData) {
        e.preventDefault();
        const updatedData: ParsedResult = {
          ...parsedData,
          programs: parsedData.programs.map(p => {
            if (p.name !== selectedRoutine.program) return p;
            return {
              ...p,
              routines: p.routines.map(r => {
                if (r.name !== selectedRoutine.name) return r;
                const newRungNumber = r.rungs.length > 0 ? Math.max(...r.rungs.map(rg => rg.number)) + 1 : 0;
                return {
                  ...r,
                  rungs: [...r.rungs, { ...copiedRung, number: newRungNumber }]
                };
              })
            };
          })
        };
        setParsedData(updatedData);
        toast({ description: `Pasted rung`, duration: 1000 });
      }
      // Delete rung: Delete key
      else if (e.key === 'Delete' && selectedRungNumber !== null && selectedRoutine && parsedData) {
        e.preventDefault();
        const updatedData: ParsedResult = {
          ...parsedData,
          programs: parsedData.programs.map(p => {
            if (p.name !== selectedRoutine.program) return p;
            return {
              ...p,
              routines: p.routines.map(r => {
                if (r.name !== selectedRoutine.name) return r;
                return {
                  ...r,
                  rungs: r.rungs.filter(rg => rg.number !== selectedRungNumber)
                    .map((rg, idx) => ({ ...rg, number: idx }))
                };
              })
            };
          })
        };
        setParsedData(updatedData);
        setSelectedRungNumber(null);
        toast({ description: `Deleted rung ${selectedRungNumber}`, duration: 1000 });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, handleUndo, handleRedo, selectedRungNumber, selectedRoutine, parsedData, copiedRung, setParsedData, toast]);
  
  // Create a new project from scratch
  const handleCreateProject = (controllerName: string, programName: string, routineName: string) => {
    const newProject: ParsedResult = {
      controllerName,
      programs: [
        {
          name: programName,
          routines: [
            {
              name: routineName,
              rungs: []
            }
          ],
          tags: []
        }
      ],
      controllerTags: []
    };
    
    setParsedData(newProject);
    setFileName(`${controllerName}.l5x`);
    setFileSize("New Project");
    setSelectedRoutine({ program: programName, name: routineName });
    setSelectedRungNumber(null); // Reset rung selection for new project
    setError(null);
    
    toast({
      description: `Created new project: ${controllerName}`,
      duration: 1000,
    });
  };
  
  // Add a new routine to an existing program
  const handleCreateRoutine = (programName: string, routineName: string) => {
    if (!parsedData) return;
    
    // Check for duplicate routine name within the program
    const program = parsedData.programs.find(p => p.name === programName);
    if (program?.routines.some(r => r.name.toLowerCase() === routineName.toLowerCase())) {
      toast({
        variant: "destructive",
        description: `Routine "${routineName}" already exists in ${programName}`,
      });
      return;
    }
    
    const updatedData: ParsedResult = {
      ...parsedData,
      programs: parsedData.programs.map(p => {
        if (p.name !== programName) return p;
        
        return {
          ...p,
          routines: [
            ...p.routines,
            {
              name: routineName,
              rungs: []
            }
          ]
        };
      })
    };
    
    setParsedData(updatedData);
    setSelectedRoutine({ program: programName, name: routineName });
    
    toast({
      description: `Created new routine: ${routineName}`,
      duration: 1000,
    });
  };
  
  // Create a new program
  const handleCreateProgram = (programName: string, routineName: string) => {
    if (!parsedData) return;
    
    // Check if program already exists
    if (parsedData.programs.some(p => p.name === programName)) {
      toast({
        variant: "destructive",
        description: `Program "${programName}" already exists`,
      });
      return;
    }
    
    const updatedData: ParsedResult = {
      ...parsedData,
      programs: [
        ...parsedData.programs,
        {
          name: programName,
          routines: [{ name: routineName, rungs: [] }],
          tags: [],
        }
      ]
    };
    
    setParsedData(updatedData);
    setSelectedRoutine({ program: programName, name: routineName });
    
    toast({
      description: `Created new program: ${programName}`,
      duration: 1000,
    });
  };
  
  // Rename handlers
  const openRenameDialog = (type: "program" | "routine" | "controller", name: string, programName?: string) => {
    setRenameTarget({ type, name, programName });
    setRenameDialogOpen(true);
  };
  
  const handleRename = (newName: string) => {
    if (!parsedData || !renameTarget) return;
    
    if (renameTarget.type === "controller") {
      setParsedData({ ...parsedData, controllerName: newName });
      toast({ description: `Renamed controller to: ${newName}`, duration: 1000 });
    } else if (renameTarget.type === "program") {
      // Check for duplicate program name
      if (parsedData.programs.some(p => p.name.toLowerCase() === newName.toLowerCase() && p.name !== renameTarget.name)) {
        toast({
          variant: "destructive",
          description: `Program "${newName}" already exists`,
        });
        return;
      }
      setParsedData({
        ...parsedData,
        programs: parsedData.programs.map(p => 
          p.name === renameTarget.name ? { ...p, name: newName } : p
        )
      });
      if (selectedRoutine?.program === renameTarget.name) {
        setSelectedRoutine({ ...selectedRoutine, program: newName });
      }
      toast({ description: `Renamed program to: ${newName}`, duration: 1000 });
    } else if (renameTarget.type === "routine" && renameTarget.programName) {
      // Check for duplicate routine name within the program
      const program = parsedData.programs.find(p => p.name === renameTarget.programName);
      if (program?.routines.some(r => r.name.toLowerCase() === newName.toLowerCase() && r.name !== renameTarget.name)) {
        toast({
          variant: "destructive",
          description: `Routine "${newName}" already exists in ${renameTarget.programName}`,
        });
        return;
      }
      setParsedData({
        ...parsedData,
        programs: parsedData.programs.map(p => {
          if (p.name !== renameTarget.programName) return p;
          return {
            ...p,
            routines: p.routines.map(r => 
              r.name === renameTarget.name ? { ...r, name: newName } : r
            )
          };
        })
      });
      if (selectedRoutine?.program === renameTarget.programName && selectedRoutine?.name === renameTarget.name) {
        setSelectedRoutine({ ...selectedRoutine, name: newName });
      }
      toast({ description: `Renamed routine to: ${newName}`, duration: 1000 });
    }
    setRenameTarget(null);
  };
  
  // Delete handlers
  const openDeleteDialog = (type: "program" | "routine", name: string, programName?: string) => {
    setDeleteTarget({ type, name, programName });
    setDeleteDialogOpen(true);
  };
  
  const handleDelete = () => {
    if (!parsedData || !deleteTarget) return;
    
    if (deleteTarget.type === "program") {
      if (parsedData.programs.length <= 1) {
        toast({
          variant: "destructive",
          description: "Cannot delete the last program",
        });
        return;
      }
      setParsedData({
        ...parsedData,
        programs: parsedData.programs.filter(p => p.name !== deleteTarget.name)
      });
      if (selectedRoutine?.program === deleteTarget.name) {
        const firstProgram = parsedData.programs.find(p => p.name !== deleteTarget.name);
        if (firstProgram && firstProgram.routines.length > 0) {
          setSelectedRoutine({ program: firstProgram.name, name: firstProgram.routines[0].name });
        } else {
          setSelectedRoutine(null);
        }
      }
      toast({ description: `Deleted program: ${deleteTarget.name}`, duration: 1000 });
    } else if (deleteTarget.type === "routine" && deleteTarget.programName) {
      const program = parsedData.programs.find(p => p.name === deleteTarget.programName);
      if (program && program.routines.length <= 1) {
        toast({
          variant: "destructive",
          description: "Cannot delete the last routine in a program",
        });
        return;
      }
      setParsedData({
        ...parsedData,
        programs: parsedData.programs.map(p => {
          if (p.name !== deleteTarget.programName) return p;
          return {
            ...p,
            routines: p.routines.filter(r => r.name !== deleteTarget.name)
          };
        })
      });
      if (selectedRoutine?.program === deleteTarget.programName && selectedRoutine?.name === deleteTarget.name) {
        const prog = parsedData.programs.find(p => p.name === deleteTarget.programName);
        const firstRoutine = prog?.routines.find(r => r.name !== deleteTarget.name);
        if (firstRoutine) {
          setSelectedRoutine({ program: deleteTarget.programName, name: firstRoutine.name });
        } else {
          setSelectedRoutine(null);
        }
      }
      toast({ description: `Deleted routine: ${deleteTarget.name}`, duration: 1000 });
    }
    setDeleteTarget(null);
  };
  
  // Handle instruction palette click
  const handleInstructionClick = (instruction: InstructionDefinition) => {
    if (!selectedRoutine) return; // Buttons are disabled when no routine selected
    setSelectedInstruction(instruction);
    setInstructionEditorOpen(true);
  };
  
  // Handle instruction editor confirm - add to selected rung or create new
  const handleInstructionConfirm = (instructionData: Record<string, string | number>) => {
    if (!selectedRoutine || !parsedData) return;
    
    const currentRungs = getCurrentRoutineRungs() || [];
    const instructionType = instructionData.type as string;
    
    // If a rung is selected, add instruction to that rung
    if (selectedRungNumber !== null) {
      addInstructionToRung(selectedRoutine.program, selectedRoutine.name, selectedRungNumber, instructionData);
      toast({
        description: `Added ${instructionType} to rung ${selectedRungNumber}`,
        duration: 1000,
      });
    } else {
      // Create a new rung with the instruction
      const nextRungNumber = currentRungs.length > 0 
        ? Math.max(...currentRungs.map(r => r.number)) + 1 
        : 0;
      
      // Build rung text
      const params = Object.entries(instructionData)
        .filter(([k]) => k !== 'type')
        .map(([, v]) => v);
      const rungText = params.length > 0 
        ? `${instructionType}(${params.join(',')})` 
        : instructionType;
      
      const newRung = {
        number: nextRungNumber,
        text: rungText,
        parsed: [instructionData],
      };
      
      addRungToRoutine(selectedRoutine.program, selectedRoutine.name, newRung);
      setSelectedRungNumber(nextRungNumber); // Auto-select the new rung
      
      toast({
        description: `Created rung ${nextRungNumber} with ${instructionType}`,
        duration: 1000,
      });
    }
    
    setSelectedInstruction(null);
  };
  
  // Add instruction to an existing rung
  const addInstructionToRung = (
    programName: string,
    routineName: string,
    rungNumber: number,
    instruction: Record<string, string | number>
  ) => {
    if (!parsedData) return;
    
    // Convert instruction data to RungElement format
    const rungInstruction = {
      type: instruction.type as string,
      tag: instruction.tag as string | undefined,
      ...instruction,
    };
    
    const updatedData: ParsedResult = {
      ...parsedData,
      programs: parsedData.programs.map(program => {
        if (program.name !== programName) return program;
        
        return {
          ...program,
          routines: program.routines.map(routine => {
            if (routine.name !== routineName) return routine;
            
            return {
              ...routine,
              rungs: routine.rungs.map(rung => {
                if (rung.number !== rungNumber) return rung;
                
                // Add instruction to the rung's parsed array
                const instructionType = instruction.type as string;
                const params = Object.entries(instruction)
                  .filter(([k]) => k !== 'type')
                  .map(([, v]) => v);
                const instructionText = params.length > 0 
                  ? `${instructionType}(${params.join(',')})` 
                  : instructionType;
                
                return {
                  ...rung,
                  text: rung.text ? `${rung.text} ${instructionText}` : instructionText,
                  parsed: [...rung.parsed, rungInstruction as any],
                };
              })
            };
          })
        };
      })
    };
    
    setParsedData(updatedData);
  };
  
  // Create a new empty rung and select it for editing
  const handleCreateNewRung = () => {
    if (!selectedRoutine || !parsedData) return;
    
    const currentRungs = getCurrentRoutineRungs() || [];
    const nextRungNumber = currentRungs.length > 0 
      ? Math.max(...currentRungs.map(r => r.number)) + 1 
      : 0;
    
    const newRung = {
      number: nextRungNumber,
      text: "",
      parsed: [],
    };
    
    addRungToRoutine(selectedRoutine.program, selectedRoutine.name, newRung);
    setSelectedRungNumber(nextRungNumber);
    
    toast({
      description: `Created rung ${nextRungNumber} - now add instructions`,
      duration: 1000,
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.l5x')) {
      setError('Invalid file type. Please select a .L5X file.');
      setParsedData(null);
      setFileName(null);
      setFileSize(null);
      return;
    }

    setLoading(true);
    setError(null);
    setParsedData(null);
    setSelectedRoutine(null);
    setSelectedRungNumber(null); // Reset rung selection for new file

    try {
      const text = await file.text();
      
      const result = parseL5X(text);
      
      if ('error' in result) {
        setError(result.error);
        setFileName(null);
        setFileSize(null);
      } else {
        setParsedData(result);
        setFileName(file.name);
        setFileSize(formatFileSize(file.size));
      }
    } catch (err) {
      setError(`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setFileName(null);
      setFileSize(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get rungs for the currently selected routine
  const getCurrentRoutineRungs = () => {
    if (!parsedData || !selectedRoutine) return null;
    
    const program = parsedData.programs.find(p => p.name === selectedRoutine.program);
    if (!program) return null;
    
    const routine = program.routines.find(r => r.name === selectedRoutine.name);
    return routine?.rungs || null;
  };

  // Function to add a rung to a specific routine (immutable update)
  const addRungToRoutine = (
    programName: string, 
    routineName: string, 
    newRung: { number: number; text: string; parsed: any[] }
  ) => {
    if (!parsedData) return;

    // Deep copy the parsedData structure
    const updatedData: ParsedResult = {
      ...parsedData,
      programs: parsedData.programs.map(program => {
        if (program.name !== programName) return program;
        
        return {
          ...program,
          routines: program.routines.map(routine => {
            if (routine.name !== routineName) return routine;
            
            return {
              ...routine,
              rungs: [...routine.rungs, newRung]
            };
          })
        };
      })
    };

    setParsedData(updatedData);
  };

  // Function to remove a rung from a specific routine (immutable update)
  const removeRungFromRoutine = (
    programName: string,
    routineName: string,
    rungNumber: number
  ) => {
    if (!parsedData) return;

    // Deep copy the parsedData structure
    const updatedData: ParsedResult = {
      ...parsedData,
      programs: parsedData.programs.map(program => {
        if (program.name !== programName) return program;
        
        return {
          ...program,
          routines: program.routines.map(routine => {
            if (routine.name !== routineName) return routine;
            
            return {
              ...routine,
              // Use Number() conversion to handle type mismatches between string/number
              rungs: routine.rungs.filter(rung => Number(rung.number) !== Number(rungNumber))
            };
          })
        };
      })
    };

    setParsedData(updatedData);
    
    toast({
      description: `Removed rung ${rungNumber} from ${routineName}`,
      duration: 1000,
    });
  };

  const handleRoutineClick = (programName: string, routineName: string) => {
    setSelectedRoutine({ program: programName, name: routineName });
    setSelectedRungNumber(null); // Reset rung selection when changing routines
  };
  
  // Handle click on an existing instruction within a rung (for editing)
  const handleExistingInstructionClick = (data: InstructionClickData) => {
    setEditingInstruction(data);
    setInstructionEditDialogOpen(true);
  };
  
  // Save edited instruction
  const handleSaveInstruction = (instruction: InstructionClickData, updates: Record<string, string>) => {
    if (!parsedData || !selectedRoutine) return;
    
    const updatedData: ParsedResult = {
      ...parsedData,
      programs: parsedData.programs.map(program => {
        if (program.name !== selectedRoutine.program) return program;
        
        return {
          ...program,
          routines: program.routines.map(routine => {
            if (routine.name !== selectedRoutine.name) return routine;
            
            return {
              ...routine,
              rungs: routine.rungs.map(rung => {
                if (rung.number !== instruction.rungNumber) return rung;
                
                // Update the parsed instruction at the given index
                const updatedParsed = [...rung.parsed];
                if (updatedParsed[instruction.index]) {
                  updatedParsed[instruction.index] = {
                    ...updatedParsed[instruction.index],
                    ...updates
                  };
                }
                
                return {
                  ...rung,
                  parsed: updatedParsed
                };
              })
            };
          })
        };
      })
    };
    
    setParsedData(updatedData);
    toast({
      description: `Updated ${instruction.type} instruction`,
      duration: 1000,
    });
  };
  
  // Delete instruction from rung
  const handleDeleteInstruction = (instruction: InstructionClickData) => {
    if (!parsedData || !selectedRoutine) return;
    
    const updatedData: ParsedResult = {
      ...parsedData,
      programs: parsedData.programs.map(program => {
        if (program.name !== selectedRoutine.program) return program;
        
        return {
          ...program,
          routines: program.routines.map(routine => {
            if (routine.name !== selectedRoutine.name) return routine;
            
            return {
              ...routine,
              rungs: routine.rungs.map(rung => {
                if (rung.number !== instruction.rungNumber) return rung;
                
                // Remove the instruction at the given index
                const updatedParsed = rung.parsed.filter((_, i) => i !== instruction.index);
                
                return {
                  ...rung,
                  parsed: updatedParsed
                };
              }).filter(rung => rung.parsed.length > 0) // Remove empty rungs
            };
          })
        };
      })
    };
    
    setParsedData(updatedData);
    toast({
      description: `Deleted ${instruction.type} instruction`,
      duration: 1000,
    });
  };
  
  // Get all available tags for autocomplete
  const getAvailableTags = (): string[] => {
    if (!parsedData) return [];
    const tags: string[] = [...parsedData.controllerTags];
    parsedData.programs.forEach(p => tags.push(...p.tags));
    return tags;
  };
  
  // Tag Management handlers
  const handleAddTag = (tag: { name: string; dataType: string; scope: "controller" | "program"; programName?: string }) => {
    if (!parsedData) return;
    
    if (tag.scope === "controller") {
      setParsedData({
        ...parsedData,
        controllerTags: [...parsedData.controllerTags, tag.name],
      });
    } else if (tag.programName) {
      setParsedData({
        ...parsedData,
        programs: parsedData.programs.map(p => {
          if (p.name !== tag.programName) return p;
          return { ...p, tags: [...p.tags, tag.name] };
        }),
      });
    }
    
    toast({ description: `Created tag: ${tag.name}`, duration: 1000 });
  };
  
  const handleEditTag = (oldName: string, newTag: { name: string; dataType: string; scope: "controller" | "program"; programName?: string }) => {
    if (!parsedData) return;
    
    if (newTag.scope === "controller") {
      setParsedData({
        ...parsedData,
        controllerTags: parsedData.controllerTags.map(t => t === oldName ? newTag.name : t),
      });
    } else if (newTag.programName) {
      setParsedData({
        ...parsedData,
        programs: parsedData.programs.map(p => {
          if (p.name !== newTag.programName) return p;
          return { ...p, tags: p.tags.map(t => t === oldName ? newTag.name : t) };
        }),
      });
    }
    
    toast({ description: `Updated tag: ${newTag.name}`, duration: 1000 });
  };
  
  const handleDeleteTag = (tagName: string, scope: "controller" | "program", programName?: string) => {
    if (!parsedData) return;
    
    if (scope === "controller") {
      setParsedData({
        ...parsedData,
        controllerTags: parsedData.controllerTags.filter(t => t !== tagName),
      });
    } else if (programName) {
      setParsedData({
        ...parsedData,
        programs: parsedData.programs.map(p => {
          if (p.name !== programName) return p;
          return { ...p, tags: p.tags.filter(t => t !== tagName) };
        }),
      });
    }
    
    toast({ description: `Deleted tag: ${tagName}`, duration: 1000 });
  };

  const handleCopyJSON = async () => {
    const rungs = getCurrentRoutineRungs();
    if (!rungs) return;
    
    try {
      const jsonOutput = JSON.stringify(rungs, null, 2);
      await navigator.clipboard.writeText(jsonOutput);
      setCopied(true);
      toast({
        description: "JSON copied to clipboard",
        duration: 1000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to copy to clipboard",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getTotalRoutineCount = () => {
    if (!parsedData) return 0;
    return parsedData.programs.reduce((sum, p) => sum + p.routines.length, 0);
  };

  const getTotalTagCount = () => {
    if (!parsedData) return 0;
    const programTagCount = parsedData.programs.reduce((sum, p) => sum + p.tags.length, 0);
    return parsedData.controllerTags.length + programTagCount;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-2 md:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">L5X Ladder Logic IDE</h1>
          <p className="text-xs text-muted-foreground">
            RSLogix 5000 editor with AI assistance
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 xl:grid-cols-12 gap-2 p-2">
          {/* Left Panel - Upload & Tree View */}
          <section className="flex flex-col h-full xl:col-span-3 gap-2 min-h-0" aria-label="File upload and project structure">
            {/* File Upload */}
            <Card className="p-2 flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".l5x,.L5X"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file-upload"
                aria-label="Upload L5X file"
              />
              
              <div className="flex gap-1 mb-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setNewProjectDialogOpen(true)}
                  data-testid="button-new-project"
                >
                  <FolderPlus className="w-3 h-3 mr-1" />
                  Project
                </Button>
                {parsedData && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setNewProgramDialogOpen(true)}
                      data-testid="button-new-program"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Program
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setNewRoutineDialogOpen(true)}
                      data-testid="button-new-routine"
                    >
                      <FilePlus className="w-3 h-3 mr-1" />
                      Routine
                    </Button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full border border-dashed border-border rounded-md p-2 hover-elevate active-elevate-2 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-select-file"
                aria-label="Select L5X file to upload"
              >
                <div className="flex items-center justify-center gap-2">
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div className="text-xs font-medium text-foreground">
                    {loading ? "Parsing..." : "Import L5X"}
                  </div>
                </div>
              </button>

              {/* Undo/Redo and Export Buttons */}
              {parsedData && (
                <div className="mt-2 flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleUndo}
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                    data-testid="button-undo"
                  >
                    <Undo2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleRedo}
                    disabled={!canRedo}
                    title="Redo (Ctrl+Y)"
                    data-testid="button-redo"
                  >
                    <Redo2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={() => downloadL5X(parsedData, fileName?.replace(/\.[^.]+$/, '_export.L5X') || 'project.L5X')}
                    data-testid="button-export-l5x"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Export L5X
                  </Button>
                </div>
              )}

              {/* File Status */}
              {fileName && !error && parsedData && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-muted/50 rounded-md text-xs" data-testid="status-file-info">
                  <CheckCircle2 className="w-3 h-3 text-chart-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {fileName}
                    </div>
                    <span className="text-muted-foreground"> - {parsedData.controllerName}</span>
                  </div>
                </div>
              )}

              {/* Error Status */}
              {error && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-destructive/10 rounded-md text-xs" data-testid="status-error" role="alert">
                  <AlertCircle className="w-3 h-3 text-destructive flex-shrink-0" />
                  <div className="text-destructive">{error}</div>
                </div>
              )}

              {/* File Stats */}
              {parsedData && (
                <div className="mt-2 flex flex-wrap gap-1" data-testid="status-stats">
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {parsedData.programs.length}P
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {getTotalRoutineCount()}R
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {getTotalTagCount()}T
                  </Badge>
                </div>
              )}
            </Card>

            {/* Tree View */}
            {parsedData && (
              <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="p-2 border-b border-border bg-card flex-shrink-0 space-y-2">
                  <h2 className="text-sm font-semibold text-foreground">Structure</h2>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="pl-7 pr-7 h-7 text-xs"
                      data-testid="input-search-tree"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={() => setSearchQuery("")}
                        data-testid="button-clear-search"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 min-h-0">
                  <TreeView 
                    data={parsedData} 
                    onRoutineClick={handleRoutineClick}
                    selectedRoutine={selectedRoutine}
                    searchQuery={searchQuery}
                    onRenameController={() => openRenameDialog("controller", parsedData.controllerName)}
                    onRenameProgram={(name) => openRenameDialog("program", name)}
                    onDeleteProgram={(name) => openDeleteDialog("program", name)}
                    onRenameRoutine={(programName, routineName) => openRenameDialog("routine", routineName, programName)}
                    onDeleteRoutine={(programName, routineName) => openDeleteDialog("routine", routineName, programName)}
                  />
                </div>
              </Card>
            )}
          </section>

          {/* Center Panel - Parsed Logic Viewer */}
          <section className="flex flex-col h-full xl:col-span-5 min-h-0" aria-label="Parsed Logic Viewer">
            <Card className="h-full flex flex-col overflow-hidden">
              {selectedRoutine ? (
                <>
                  <div className="flex p-3 border-b border-border items-center justify-between bg-card flex-shrink-0">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-foreground truncate">
                        {selectedRoutine.name}
                      </h2>
                      <p className="text-sm text-muted-foreground truncate">
                        {selectedRoutine.program}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyJSON}
                      disabled={!getCurrentRoutineRungs()}
                      className="ml-4 flex-shrink-0"
                      data-testid="button-copy-json"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy JSON
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex-1 overflow-auto bg-muted/30 min-h-0">
                    {(() => {
                      const rungs = getCurrentRoutineRungs();
                      return (
                        <div className="p-2 space-y-2">
                          {rungs && rungs.length > 0 ? (
                            rungs.map((rung) => (
                              <RungRenderer
                                key={rung.number}
                                parsed={rung.parsed}
                                rungNumber={rung.number}
                                isSelected={selectedRungNumber === rung.number}
                                onClick={() => setSelectedRungNumber(
                                  selectedRungNumber === rung.number ? null : rung.number
                                )}
                                onInstructionClick={handleExistingInstructionClick}
                              />
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                              <AlertCircle className="w-8 h-8 mb-1 opacity-50" />
                              <div className="text-xs">No rungs yet</div>
                            </div>
                          )}
                          
                          {/* New Rung Button */}
                          <Button
                            variant="outline"
                            className="w-full border-dashed"
                            onClick={handleCreateNewRung}
                            data-testid="button-new-rung"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Rung
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                  <FileText className="w-16 h-16 mb-3 opacity-50" />
                  <div className="text-base font-medium">Select a routine to view parsed logic</div>
                  <div className="text-sm mt-1">Choose a routine from the project structure</div>
                </div>
              )}
            </Card>
          </section>

          {/* Right Panel - Instructions, Tags & AI Chat */}
          <section className="flex flex-col h-full xl:col-span-4 min-h-0" aria-label="Instructions, Tags and AI Chat">
            <Tabs defaultValue="chat" className="flex flex-col h-full">
              <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
                <TabsTrigger value="chat" data-testid="tab-chat">AI</TabsTrigger>
                <TabsTrigger value="instructions" data-testid="tab-instructions">
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </TabsTrigger>
                <TabsTrigger value="tags" data-testid="tab-tags">Tags</TabsTrigger>
              </TabsList>
              <TabsContent value="chat" className="flex-1 min-h-0 mt-2">
                <ChatPanel 
                  fullProject={parsedData}
                  currentRoutine={selectedRoutine && getCurrentRoutineRungs() ? {
                    program: selectedRoutine.program,
                    name: selectedRoutine.name,
                    rungs: getCurrentRoutineRungs()!
                  } : undefined}
                  onAddRung={addRungToRoutine}
                  onRemoveRung={removeRungFromRoutine}
                />
              </TabsContent>
              <TabsContent value="instructions" className="flex-1 min-h-0 mt-2 flex flex-col gap-2">
                {selectedRoutine && (
                  <div className="p-2 bg-muted rounded-md text-xs">
                    {selectedRungNumber !== null ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary">Editing Rung {selectedRungNumber}</span>
                        <span className="text-muted-foreground">Click an instruction to add it</span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        Select a rung to add instructions, or click an instruction to create a new rung
                      </div>
                    )}
                  </div>
                )}
                <InstructionPalette 
                  onAddInstruction={handleInstructionClick}
                  disabled={!selectedRoutine}
                />
              </TabsContent>
              <TabsContent value="tags" className="flex-1 min-h-0 mt-2">
                <Card className="h-full flex flex-col">
                  {parsedData ? (
                    <TagManager
                      controllerTags={parsedData.controllerTags}
                      programs={parsedData.programs}
                      onAddTag={handleAddTag}
                      onEditTag={handleEditTag}
                      onDeleteTag={handleDeleteTag}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      Load or create a project to manage tags
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </div>
      
      {/* Instruction Editor Dialog */}
      <InstructionEditor
        instruction={selectedInstruction}
        open={instructionEditorOpen}
        onOpenChange={setInstructionEditorOpen}
        onConfirm={handleInstructionConfirm}
        availableTags={parsedData?.controllerTags?.map(t => ({ name: t, type: "BOOL" })) || []}
      />
      
      {/* New Project Dialog */}
      <NewProjectDialog
        open={newProjectDialogOpen}
        onOpenChange={setNewProjectDialogOpen}
        onConfirm={handleCreateProject}
      />
      
      {/* New Routine Dialog */}
      <NewRoutineDialog
        open={newRoutineDialogOpen}
        onOpenChange={setNewRoutineDialogOpen}
        onConfirm={handleCreateRoutine}
        programs={parsedData?.programs.map(p => p.name) || []}
      />
      
      {/* Instruction Edit Dialog */}
      <InstructionEditDialog
        open={instructionEditDialogOpen}
        onOpenChange={setInstructionEditDialogOpen}
        instruction={editingInstruction}
        onSave={handleSaveInstruction}
        onDelete={handleDeleteInstruction}
        availableTags={getAvailableTags()}
      />
      
      {/* New Program Dialog */}
      <NewProgramDialog
        open={newProgramDialogOpen}
        onOpenChange={setNewProgramDialogOpen}
        onConfirm={handleCreateProgram}
      />
      
      {/* Rename Dialog */}
      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentName={renameTarget?.name || ""}
        itemType={renameTarget?.type || "program"}
        onConfirm={handleRename}
      />
      
      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={deleteTarget?.name || ""}
        itemType={deleteTarget?.type || "program"}
        onConfirm={handleDelete}
      />
    </div>
  );
}
