import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Copy, Check, Loader2, ChevronRight, ChevronDown } from "lucide-react";
import { parseL5X, type ParsedResult } from "@/utils/parser";
import { RungRenderer } from "@/components/RungRenderer";
import { ChatPanel } from "@/components/ChatPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
}

function TreeNode({ 
  label, 
  icon, 
  onClick, 
  isClickable = false, 
  isSelected = false,
  children, 
  defaultExpanded = false,
  level = 0
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
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer select-none transition-colors ${
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
        <span className={`text-sm truncate ${isClickable ? 'font-medium text-foreground' : 'text-foreground'}`}>
          {label}
        </span>
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
}

function TreeView({ data, onRoutineClick, selectedRoutine }: TreeViewProps) {
  return (
    <div className="text-sm" data-testid="tree-view">
      {/* Controller Root */}
      <TreeNode 
        label={data.controllerName} 
        icon={<FileText className="w-4 h-4 text-chart-1" />}
        defaultExpanded={true}
        level={0}
      >
        {/* Controller Tags Section */}
        {data.controllerTags.length > 0 && (
          <TreeNode 
            label="Controller Tags"
            icon={<Badge variant="secondary" className="w-4 h-4 flex items-center justify-center text-[10px] p-0">{data.controllerTags.length}</Badge>}
            defaultExpanded={false}
            level={1}
          >
            {data.controllerTags.map((tag, index) => (
              <TreeNode
                key={`controller-tag-${tag}-${index}`}
                label={tag}
                level={2}
              />
            ))}
          </TreeNode>
        )}

        {/* Programs Section */}
        <TreeNode 
          label="Programs"
          icon={<Badge variant="secondary" className="w-4 h-4 flex items-center justify-center text-[10px] p-0">{data.programs.length}</Badge>}
          defaultExpanded={true}
          level={1}
        >
          {data.programs.map((program, pIndex) => (
            <TreeNode
              key={`program-${program.name}-${pIndex}`}
              label={program.name}
              icon={<FileText className="w-4 h-4 text-chart-3" />}
              defaultExpanded={true}
              level={2}
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
                    />
                  ))}
                </TreeNode>
              )}
            </TreeNode>
          ))}
        </TreeNode>
      </TreeNode>
    </div>
  );
}

export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  
  const [selectedRoutine, setSelectedRoutine] = useState<{ program: string; name: string } | null>(null);
  
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
    
    toast({
      description: `Added rung ${newRung.number} to ${routineName}`,
    });
  };

  const handleRoutineClick = (programName: string, routineName: string) => {
    setSelectedRoutine({ program: programName, name: routineName });
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
      <header className="border-b border-border px-4 py-4 md:px-6">
        <h1 className="text-2xl font-semibold text-foreground">L5X File Parser</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Parse and view RSLogix 5000 control files
        </p>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 xl:grid-cols-12 gap-3 p-3 md:p-4">
          {/* Left Panel - Upload & Tree View */}
          <section className="flex flex-col h-full xl:col-span-3 gap-3 min-h-0" aria-label="File upload and project structure">
            {/* File Upload */}
            <Card className="p-3 flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".l5x,.L5X"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file-upload"
                aria-label="Upload L5X file"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full border-2 border-dashed border-border rounded-md p-6 hover-elevate active-elevate-2 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-select-file"
                aria-label="Select L5X file to upload"
              >
                <div className="flex flex-col items-center gap-2">
                  {loading ? (
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  )}
                  <div className="text-sm font-medium text-foreground">
                    {loading ? "Parsing..." : "Select .L5X File"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Click to browse
                  </div>
                </div>
              </button>

              {/* File Status */}
              {fileName && !error && parsedData && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-muted/50 rounded-md" data-testid="status-file-info">
                  <CheckCircle2 className="w-4 h-4 text-chart-2 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {fileName}
                    </div>
                    <div className="text-xs text-muted-foreground">{fileSize}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Controller: {parsedData.controllerName}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Status */}
              {error && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-destructive/10 rounded-md" data-testid="status-error" role="alert">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-destructive">{error}</div>
                </div>
              )}

              {/* File Stats */}
              {parsedData && (
                <div className="mt-3 flex flex-wrap gap-2" data-testid="status-stats">
                  <Badge variant="secondary" className="text-xs">
                    {parsedData.programs.length} Programs
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {getTotalRoutineCount()} Routines
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {getTotalTagCount()} Tags
                  </Badge>
                </div>
              )}
            </Card>

            {/* Tree View */}
            {parsedData && (
              <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="p-3 border-b border-border bg-card flex-shrink-0">
                  <h2 className="text-base font-semibold text-foreground">Project Structure</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 min-h-0">
                  <TreeView 
                    data={parsedData} 
                    onRoutineClick={handleRoutineClick}
                    selectedRoutine={selectedRoutine}
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
                      return rungs && rungs.length > 0 ? (
                        <div className="p-4 space-y-4">
                          {rungs.map((rung) => (
                            <RungRenderer
                              key={rung.number}
                              parsed={rung.parsed}
                              rungNumber={rung.number}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground p-6">
                          <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                          <div className="text-sm">No rungs found in this routine</div>
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

          {/* Right Panel - AI Chat Assistant */}
          <section className="flex flex-col h-full xl:col-span-4 min-h-0" aria-label="AI Chat Assistant">
            <ChatPanel 
              fullProject={parsedData}
              currentRoutine={selectedRoutine && getCurrentRoutineRungs() ? {
                program: selectedRoutine.program,
                name: selectedRoutine.name,
                rungs: getCurrentRoutineRungs()!
              } : undefined}
              onAddRung={addRungToRoutine}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
