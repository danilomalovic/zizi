import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Copy, Check, Loader2, ChevronRight, ChevronDown } from "lucide-react";
import { parseL5X, type ParsedResult, type Program } from "@/utils/parser";
import { extractRoutineXML } from "@/utils/xml-formatter";
import { parseRung, extractRungs, type RungElement } from "@/utils/rllParser";
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
                      key={`routine-${program.name}-${routine}-${rIndex}`}
                      label={routine}
                      onClick={() => onRoutineClick(program.name, routine)}
                      isClickable={true}
                      isSelected={
                        selectedRoutine?.program === program.name &&
                        selectedRoutine?.name === routine
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
  const [originalXML, setOriginalXML] = useState<string>("");
  
  const [selectedRoutine, setSelectedRoutine] = useState<{ program: string; name: string } | null>(null);
  const [parsedRungs, setParsedRungs] = useState<Array<{ number: number; text: string; parsed: RungElement[] }> | null>(null);
  const [loadingRungs, setLoadingRungs] = useState(false);
  
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
    setParsedRungs(null);

    try {
      const text = await file.text();
      setOriginalXML(text);
      
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

  const handleRoutineClick = (programName: string, routineName: string) => {
    setSelectedRoutine({ program: programName, name: routineName });
    setLoadingRungs(true);
    
    // Simulate async operation for better UX
    setTimeout(() => {
      // Extract the routine XML
      const xml = extractRoutineXML(originalXML, programName, routineName);
      
      if (xml) {
        // Extract rungs from the XML
        const rungs = extractRungs(xml);
        
        // Parse each rung
        const parsedRungsData = rungs.map(rung => {
          try {
            const parsed = parseRung(rung.text);
            return {
              number: rung.number,
              text: rung.text,
              parsed: parsed
            };
          } catch (error) {
            console.error(`Error parsing rung ${rung.number}:`, error);
            return {
              number: rung.number,
              text: rung.text,
              parsed: []
            };
          }
        });
        
        setParsedRungs(parsedRungsData);
      } else {
        setParsedRungs(null);
      }
      
      setLoadingRungs(false);
    }, 100);
  };

  const handleCopyJSON = async () => {
    if (!parsedRungs) return;
    
    try {
      const jsonOutput = JSON.stringify(parsedRungs, null, 2);
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
        <div className="h-full flex flex-col lg:flex-row gap-4 p-4 md:p-6">
          {/* Left Panel - Upload & Tree View */}
          <section className="flex flex-col w-full lg:w-2/5 xl:w-1/3 gap-4" aria-label="File upload and project structure">
            {/* File Upload */}
            <Card className="p-4">
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
              <Card className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border sticky top-0 bg-card z-10">
                  <h2 className="text-lg font-semibold text-foreground">Project Structure</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2">
                  <TreeView 
                    data={parsedData} 
                    onRoutineClick={handleRoutineClick}
                    selectedRoutine={selectedRoutine}
                  />
                </div>
              </Card>
            )}
          </section>

          {/* Right Panel - Parsed Logic Viewer */}
          <section className="flex flex-col w-full lg:w-3/5 xl:w-2/3" aria-label="Parsed Logic Viewer">
            <Card className="flex-1 flex flex-col overflow-hidden">
              {selectedRoutine ? (
                <>
                  <div className="flex p-4 border-b border-border items-center justify-between bg-card sticky top-0 z-10">
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
                      disabled={!parsedRungs || loadingRungs}
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
                  
                  <div className="flex-1 overflow-auto bg-muted/30">
                    {loadingRungs ? (
                      <div className="flex items-center justify-center h-full w-full">
                        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                      </div>
                    ) : parsedRungs && parsedRungs.length > 0 ? (
                      <div className="p-4 space-y-6">
                        {parsedRungs.map((rung) => (
                          <div key={rung.number} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Rung {rung.number}
                              </Badge>
                              <code className="text-xs text-muted-foreground font-mono">
                                {rung.text}
                              </code>
                            </div>
                            <pre
                              className="p-3 text-sm font-mono leading-relaxed text-foreground overflow-x-auto w-full bg-background/50 rounded-md border border-border"
                              style={{ lineHeight: '1.6' }}
                              data-testid={`rung-parsed-${rung.number}`}
                            >
                              {JSON.stringify(rung.parsed, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground p-6">
                        <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                        <div className="text-sm">No rungs found in this routine</div>
                      </div>
                    )}
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
        </div>
      </div>
    </div>
  );
}
