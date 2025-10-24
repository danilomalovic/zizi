import { useState, useMemo, useRef, useEffect } from "react";
import { Upload, Search, FileText, CheckCircle2, AlertCircle, Copy, Check, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";
import { parseL5X, type ParsedResult, type Program } from "@/utils/parser";
import { extractRoutineXML } from "@/utils/xml-formatter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface RoutineDisplay {
  program: string;
  name: string;
}

export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [originalXML, setOriginalXML] = useState<string>("");
  
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineDisplay | null>(null);
  const [selectedRoutineIndex, setSelectedRoutineIndex] = useState<number>(-1);
  const [routineXML, setRoutineXML] = useState<string | null>(null);
  const [loadingXML, setLoadingXML] = useState(false);
  
  const [routineSearch, setRoutineSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  
  const [copied, setCopied] = useState(false);
  
  // Mobile collapsible states
  const [routinesExpanded, setRoutinesExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [viewerExpanded, setViewerExpanded] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const routineListRef = useRef<HTMLDivElement>(null);
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
    setSelectedRoutineIndex(-1);
    setRoutineXML(null);
    setRoutineSearch("");
    setTagSearch("");

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

  const handleRoutineClick = (routine: RoutineDisplay, index: number) => {
    setSelectedRoutine(routine);
    setSelectedRoutineIndex(index);
    setLoadingXML(true);
    
    // Simulate async operation for better UX
    setTimeout(() => {
      const xml = extractRoutineXML(originalXML, routine.program, routine.name);
      setRoutineXML(xml);
      setLoadingXML(false);
    }, 100);
  };

  const handleCopyXML = async () => {
    if (!routineXML) return;
    
    try {
      await navigator.clipboard.writeText(routineXML);
      setCopied(true);
      toast({
        description: "XML copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to copy to clipboard",
      });
    }
  };

  // Flatten programs into routine display list
  const allRoutines = useMemo(() => {
    if (!parsedData) return [];
    
    const routines: RoutineDisplay[] = [];
    for (const program of parsedData.programs) {
      for (const routineName of program.routines) {
        routines.push({
          program: program.name,
          name: routineName,
        });
      }
    }
    return routines;
  }, [parsedData]);

  const filteredRoutines = useMemo(() => {
    if (!routineSearch.trim()) return allRoutines;
    
    const search = routineSearch.toLowerCase();
    return allRoutines.filter(
      (r) =>
        r.name.toLowerCase().includes(search) ||
        r.program.toLowerCase().includes(search)
    );
  }, [allRoutines, routineSearch]);

  // Filter tags
  const filteredControllerTags = useMemo(() => {
    if (!parsedData) return [];
    if (!tagSearch.trim()) return parsedData.controllerTags;
    
    const search = tagSearch.toLowerCase();
    return parsedData.controllerTags.filter((tag) => tag.toLowerCase().includes(search));
  }, [parsedData, tagSearch]);

  const filteredProgramsWithTags = useMemo(() => {
    if (!parsedData) return [];
    if (!tagSearch.trim()) return parsedData.programs;
    
    const search = tagSearch.toLowerCase();
    return parsedData.programs
      .map((program) => ({
        ...program,
        tags: program.tags.filter((tag) => tag.toLowerCase().includes(search)),
      }))
      .filter((program) => program.tags.length > 0 || program.name.toLowerCase().includes(search));
  }, [parsedData, tagSearch]);

  // Reset selection when filtered routines change
  useEffect(() => {
    if (selectedRoutineIndex >= filteredRoutines.length) {
      setSelectedRoutineIndex(-1);
      setSelectedRoutine(null);
      setRoutineXML(null);
    }
  }, [filteredRoutines, selectedRoutineIndex]);

  // Keyboard navigation for routine list
  const handleRoutineListKeyDown = (e: React.KeyboardEvent) => {
    if (filteredRoutines.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentIndex = selectedRoutineIndex < 0 ? -1 : selectedRoutineIndex;
      const newIndex = Math.min(currentIndex + 1, filteredRoutines.length - 1);
      if (newIndex >= 0 && newIndex < filteredRoutines.length) {
        handleRoutineClick(filteredRoutines[newIndex], newIndex);
        scrollToRoutineIndex(newIndex);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = selectedRoutineIndex < 0 ? filteredRoutines.length : selectedRoutineIndex;
      const newIndex = Math.max(currentIndex - 1, 0);
      if (newIndex >= 0 && newIndex < filteredRoutines.length) {
        handleRoutineClick(filteredRoutines[newIndex], newIndex);
        scrollToRoutineIndex(newIndex);
      }
    } else if (e.key === 'Enter' && selectedRoutineIndex >= 0 && selectedRoutineIndex < filteredRoutines.length) {
      e.preventDefault();
      const routine = filteredRoutines[selectedRoutineIndex];
      if (routine) {
        handleRoutineClick(routine, selectedRoutineIndex);
      }
    }
  };

  const scrollToRoutineIndex = (index: number) => {
    const listElement = routineListRef.current;
    if (!listElement) return;
    
    const buttons = listElement.querySelectorAll('[data-routine-index]');
    const targetButton = buttons[index] as HTMLElement;
    if (targetButton) {
      targetButton.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
          {/* Left Panel - Upload & Routines */}
          <section className="flex flex-col w-full lg:w-1/4 gap-4" aria-label="File upload and routines">
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

            {/* Routines List */}
            {parsedData && (
              <Card className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile collapsible header */}
                <button
                  onClick={() => setRoutinesExpanded(!routinesExpanded)}
                  className="lg:hidden flex items-center justify-between p-4 border-b border-border hover-elevate active-elevate-2 w-full text-left"
                  data-testid="button-toggle-routines"
                  aria-expanded={routinesExpanded}
                  aria-controls="routines-content"
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">Routines</h2>
                    <Badge variant="outline" className="text-xs" data-testid="badge-routine-count">
                      {filteredRoutines.length}
                    </Badge>
                  </div>
                  {routinesExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {/* Desktop header (always visible) */}
                <div className="hidden lg:block p-4 border-b border-border sticky top-0 bg-card z-10">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-foreground">Routines</h2>
                    <Badge variant="outline" className="text-xs" data-testid="badge-routine-count-desktop">
                      {filteredRoutines.length}
                    </Badge>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="search"
                      placeholder="Search routines..."
                      value={routineSearch}
                      onChange={(e) => setRoutineSearch(e.target.value)}
                      className="pl-9 pr-8 h-9"
                      data-testid="input-search-routines"
                      aria-label="Search routines"
                    />
                    {routineSearch && (
                      <button
                        onClick={() => setRoutineSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        data-testid="button-clear-routine-search"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible content */}
                <div
                  id="routines-content"
                  className={`${routinesExpanded ? 'flex' : 'hidden'} lg:flex flex-col flex-1 overflow-hidden`}
                >
                  {/* Mobile search (inside collapsible) */}
                  <div className="lg:hidden p-4 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        type="search"
                        placeholder="Search routines..."
                        value={routineSearch}
                        onChange={(e) => setRoutineSearch(e.target.value)}
                        className="pl-9 pr-8 h-9"
                        data-testid="input-search-routines-mobile"
                        aria-label="Search routines"
                      />
                      {routineSearch && (
                        <button
                          onClick={() => setRoutineSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          data-testid="button-clear-routine-search-mobile"
                          aria-label="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    ref={routineListRef}
                    className="flex-1 overflow-y-auto p-2"
                    onKeyDown={handleRoutineListKeyDown}
                    tabIndex={0}
                    role="listbox"
                    aria-label="Routine list"
                    aria-activedescendant={
                      selectedRoutineIndex >= 0
                        ? `routine-option-${selectedRoutineIndex}`
                        : undefined
                    }
                  >
                    {filteredRoutines.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                        <FileText className="w-12 h-12 mb-2 opacity-50" />
                        <div className="text-sm">No routines found</div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredRoutines.map((routine, index) => (
                          <button
                            id={`routine-option-${index}`}
                            key={`${routine.program}-${routine.name}-${index}`}
                            onClick={() => handleRoutineClick(routine, index)}
                            data-routine-index={index}
                            className={`w-full text-left p-3 rounded-md transition-colors hover-elevate active-elevate-2 focus:outline-none focus:ring-2 focus:ring-ring min-h-[2.5rem] ${
                              selectedRoutineIndex === index
                                ? "bg-accent"
                                : ""
                            }`}
                            data-testid={`button-routine-${index}`}
                            role="option"
                            aria-selected={selectedRoutineIndex === index}
                          >
                            <div className="font-medium text-sm text-foreground">
                              {routine.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {routine.program}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </section>

          {/* Middle Panel - Tags */}
          {parsedData && (
            <section className="flex flex-col w-full lg:w-1/4 gap-4" aria-label="Tags">
              <Card className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile collapsible header */}
                <button
                  onClick={() => setTagsExpanded(!tagsExpanded)}
                  className="lg:hidden flex items-center justify-between p-4 border-b border-border hover-elevate active-elevate-2 w-full text-left"
                  data-testid="button-toggle-tags"
                  aria-expanded={tagsExpanded}
                  aria-controls="tags-content"
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">Tags</h2>
                    <Badge variant="outline" className="text-xs" data-testid="badge-tag-count">
                      {filteredControllerTags.length + filteredProgramsWithTags.reduce((sum, p) => sum + p.tags.length, 0)}
                    </Badge>
                  </div>
                  {tagsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {/* Desktop header (always visible) */}
                <div className="hidden lg:block p-4 border-b border-border sticky top-0 bg-card z-10">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-foreground">Tags</h2>
                    <Badge variant="outline" className="text-xs" data-testid="badge-tag-count-desktop">
                      {filteredControllerTags.length + filteredProgramsWithTags.reduce((sum, p) => sum + p.tags.length, 0)}
                    </Badge>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="search"
                      placeholder="Search tags..."
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      className="pl-9 pr-8 h-9"
                      data-testid="input-search-tags"
                      aria-label="Search tags"
                    />
                    {tagSearch && (
                      <button
                        onClick={() => setTagSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        data-testid="button-clear-tag-search"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible content */}
                <div
                  id="tags-content"
                  className={`${tagsExpanded ? 'flex' : 'hidden'} lg:flex flex-col flex-1 overflow-hidden`}
                >
                  {/* Mobile search (inside collapsible) */}
                  <div className="lg:hidden p-4 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        type="search"
                        placeholder="Search tags..."
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        className="pl-9 pr-8 h-9"
                        data-testid="input-search-tags-mobile"
                        aria-label="Search tags"
                      />
                      {tagSearch && (
                        <button
                          onClick={() => setTagSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          data-testid="button-clear-tag-search-mobile"
                          aria-label="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2" role="list">
                    {filteredControllerTags.length === 0 && filteredProgramsWithTags.every(p => p.tags.length === 0) ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                        <FileText className="w-12 h-12 mb-2 opacity-50" />
                        <div className="text-sm">No tags found</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Controller Tags */}
                        {filteredControllerTags.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2 px-2">
                              <h3 className="text-sm font-semibold text-foreground">Controller Tags</h3>
                              <Badge variant="secondary" className="text-xs">
                                {filteredControllerTags.length}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              {filteredControllerTags.map((tag, index) => (
                                <div
                                  key={`controller-${tag}-${index}`}
                                  className="px-3 py-2 text-sm text-foreground hover-elevate rounded-md"
                                  data-testid={`text-controller-tag-${index}`}
                                  role="listitem"
                                >
                                  {tag}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Program Tags (grouped by program) */}
                        {filteredProgramsWithTags.map((program, pIndex) => (
                          program.tags.length > 0 && (
                            <div key={`program-tags-${program.name}-${pIndex}`}>
                              <div className="flex items-center gap-2 mb-2 px-2">
                                <h3 className="text-sm font-semibold text-foreground">{program.name} Tags</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {program.tags.length}
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                {program.tags.map((tag, index) => (
                                  <div
                                    key={`program-${program.name}-${tag}-${index}`}
                                    className="px-3 py-2 rounded-md hover-elevate"
                                    data-testid={`text-program-tag-${pIndex}-${index}`}
                                    role="listitem"
                                  >
                                    <div className="text-sm text-foreground">{tag}</div>
                                    <div className="text-xs text-muted-foreground">({program.name})</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* Right Panel - XML Viewer */}
          <section className="flex flex-col w-full lg:w-1/2 gap-4" aria-label="XML Viewer">
            <Card className="flex-1 flex flex-col overflow-hidden">
              {selectedRoutine ? (
                <>
                  {/* Mobile collapsible header */}
                  <button
                    onClick={() => setViewerExpanded(!viewerExpanded)}
                    className="lg:hidden flex items-center justify-between p-4 border-b border-border hover-elevate active-elevate-2 w-full text-left"
                    data-testid="button-toggle-viewer"
                    aria-expanded={viewerExpanded}
                    aria-controls="viewer-content"
                  >
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-foreground truncate">
                        {selectedRoutine.name}
                      </h2>
                      <p className="text-sm text-muted-foreground truncate">
                        {selectedRoutine.program}
                      </p>
                    </div>
                    {viewerExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
                    )}
                  </button>

                  {/* Desktop header (always visible) */}
                  <div className="hidden lg:flex p-4 border-b border-border items-center justify-between bg-card sticky top-0 z-10">
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
                      onClick={handleCopyXML}
                      disabled={!routineXML || loadingXML}
                      className="ml-4 flex-shrink-0"
                      data-testid="button-copy-xml"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Mobile copy button (inside collapsible) */}
                  <div className={`${viewerExpanded ? 'flex' : 'hidden'} lg:hidden p-4 border-b border-border`}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyXML}
                      disabled={!routineXML || loadingXML}
                      className="w-full"
                      data-testid="button-copy-xml-mobile"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div
                    id="viewer-content"
                    className={`${viewerExpanded ? 'flex' : 'hidden'} lg:flex flex-1 overflow-auto bg-muted/30`}
                  >
                    {loadingXML ? (
                      <div className="flex items-center justify-center h-full w-full">
                        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                      </div>
                    ) : routineXML ? (
                      <pre
                        className="p-4 text-sm font-mono leading-relaxed text-foreground overflow-x-auto w-full"
                        style={{ lineHeight: '1.6' }}
                        data-testid="viewer-xml-content"
                      >
                        {routineXML}
                      </pre>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground p-6">
                        <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                        <div className="text-sm">Failed to extract routine XML</div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                  <FileText className="w-16 h-16 mb-3 opacity-50" />
                  <div className="text-base font-medium">Select a routine to view XML</div>
                  <div className="text-sm mt-1">Choose a routine from the list on the left</div>
                </div>
              )}
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
