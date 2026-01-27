import { useState, useMemo } from "react";
import { Search, X, Tag, FileCode, Cpu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ParsedResult } from "@/utils/parser";

interface SearchResult {
  type: "tag" | "routine" | "instruction";
  name: string;
  context: string;
  programName?: string;
  routineName?: string;
  rungNumber?: number;
}

interface SearchPanelProps {
  parsedData: ParsedResult | null;
  onSelectRoutine: (programName: string, routineName: string) => void;
  onSelectRung?: (programName: string, routineName: string, rungNumber: number) => void;
}

export function SearchPanel({ parsedData, onSelectRoutine, onSelectRung }: SearchPanelProps) {
  const [query, setQuery] = useState("");

  const results = useMemo<SearchResult[]>(() => {
    if (!parsedData || query.length < 2) return [];

    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    for (const tag of parsedData.controllerTags) {
      if (tag.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          type: "tag",
          name: tag,
          context: "Controller Tag",
        });
      }
    }

    for (const program of parsedData.programs) {
      for (const tag of program.tags) {
        if (tag.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            type: "tag",
            name: tag,
            context: `Program: ${program.name}`,
            programName: program.name,
          });
        }
      }

      for (const routine of program.routines) {
        if (routine.name.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            type: "routine",
            name: routine.name,
            context: `Program: ${program.name}`,
            programName: program.name,
            routineName: routine.name,
          });
        }

        for (const rung of routine.rungs) {
          if (rung.text?.toLowerCase().includes(lowerQuery)) {
            const matchedInstructions = rung.parsed
              ?.filter((inst: any) => 
                inst.type?.toLowerCase().includes(lowerQuery) ||
                inst.tag?.toLowerCase().includes(lowerQuery)
              )
              .map((inst: any) => inst.type)
              .join(", ");

            searchResults.push({
              type: "instruction",
              name: `Rung ${rung.number}`,
              context: `${routine.name}: ${matchedInstructions || rung.text?.substring(0, 50)}...`,
              programName: program.name,
              routineName: routine.name,
              rungNumber: rung.number,
            });
          }
        }
      }
    }

    return searchResults.slice(0, 50);
  }, [parsedData, query]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "routine" && result.programName && result.routineName) {
      onSelectRoutine(result.programName, result.routineName);
    } else if (result.type === "instruction" && result.programName && result.routineName) {
      onSelectRoutine(result.programName, result.routineName);
      if (onSelectRung && result.rungNumber !== undefined) {
        onSelectRung(result.programName, result.routineName, result.rungNumber);
      }
    } else if (result.type === "tag" && result.programName) {
      const program = parsedData?.programs.find(p => p.name === result.programName);
      if (program && program.routines.length > 0) {
        onSelectRoutine(result.programName, program.routines[0].name);
      }
    }
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "tag": return <Tag className="w-3 h-3" />;
      case "routine": return <FileCode className="w-3 h-3" />;
      case "instruction": return <Cpu className="w-3 h-3" />;
    }
  };

  if (!parsedData) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        Load a project to search
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tags, routines, instructions..."
            className="pl-8 pr-8 h-8 text-sm"
            data-testid="input-search"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setQuery("")}
              data-testid="button-clear-search"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {query.length < 2 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            Type at least 2 characters to search
          </div>
        ) : results.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            No results found for "{query}"
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {results.map((result, idx) => (
              <button
                key={`${result.type}-${result.name}-${idx}`}
                className="w-full text-left p-2 rounded-md hover-elevate transition-colors"
                onClick={() => handleResultClick(result)}
                data-testid={`search-result-${result.type}-${idx}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{getIcon(result.type)}</span>
                  <span className="text-sm font-medium truncate">{result.name}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5 pl-5">
                  {result.context}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
