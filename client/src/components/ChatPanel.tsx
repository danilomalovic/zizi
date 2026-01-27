import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAIExplanation, getAIEdit, getAIRemove, getAIAction, type AIContext } from "@/utils/aiAssistant";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  fullProject: any;
  currentRoutine?: {
    program: string;
    name: string;
    rungs?: Array<{ number: number; text: string; parsed: any[] }>;
  };
  onAddRung?: (programName: string, routineName: string, rung: { number: number; text: string; parsed: any[] }) => void;
  onRemoveRung?: (programName: string, routineName: string, rungNumber: number) => void;
  onCreateProgram?: (programName: string, routineName: string) => void;
  onCreateRoutine?: (programName: string, routineName: string) => void;
  onCreateTag?: (tag: { name: string; dataType: string; scope: "controller" | "program"; programName?: string }) => void;
  onRenameProgram?: (oldName: string, newName: string) => void;
  onRenameRoutine?: (programName: string, oldName: string, newName: string) => void;
}

export function ChatPanel({ fullProject, currentRoutine, onAddRung, onRemoveRung, onCreateProgram, onCreateRoutine, onCreateTag, onRenameProgram, onRenameRoutine }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const context: AIContext = {
        fullProject,
        currentRoutine,
      };

      // Check for explicit slash commands
      const hasEditSlashCommand = inputText.trim().startsWith('/edit');
      const hasRemoveSlashCommand = inputText.trim().startsWith('/remove');

      // Detect natural language intent (more flexible patterns)
      const lowerText = inputText.trim().toLowerCase();
      
      // Project action patterns - creating/renaming programs, routines, tags
      const projectActionPatterns = [
        /\b(create|make|add|new)\s+(a\s+)?(new\s+)?(program|routine|tag)\b/i,
        /\bnew\s+(program|routine|tag)\s+(called|named|for)/i,
        /\b(rename|change\s+the\s+name\s+of)\s+(the\s+)?(program|routine)\b/i,
        /\b(add|create)\s+.*\s+(program|routine)\s+(called|named|for|to)/i,
      ];
      
      // Removal patterns - matches various phrasings
      const removePatterns = [
        /\b(remove|delete|get rid of|erase|clear)\s+(only\s+)?(the\s+)?(rung|mov|xic|xio|ote|otl|otu|instruction|block)/i,
        /\b(remove|delete)\s+it\b/i,
        /\bi\s+want\s+you\s+to\s+(remove|delete)/i,
        /\bplease\s+(remove|delete)/i,
        /\bcan\s+you\s+(remove|delete)/i,
      ];
      
      // Add rung/instruction patterns - matches various phrasings
      const addPatterns = [
        /\b(add|create|insert|make)\s+(only\s+)?(a\s+)?(new\s+)?(rung|mov|xic|xio|ote|otl|otu|instruction|block)/i,
        /\bi\s+want\s+you\s+to\s+(add|create)\s+.*(rung|instruction)/i,
        /\bplease\s+(add|create)\s+.*(rung|instruction)/i,
        /\bcan\s+you\s+(add|create)\s+.*(rung|instruction)/i,
      ];
      
      const hasProjectActionIntent = projectActionPatterns.some(pattern => pattern.test(lowerText));
      const hasRemoveIntent = removePatterns.some(pattern => pattern.test(lowerText));
      const hasAddIntent = addPatterns.some(pattern => pattern.test(lowerText)) && !hasProjectActionIntent;

      // Determine the mode: project action, edit, remove, or ask
      const isProjectActionCommand = hasProjectActionIntent;
      const isEditCommand = hasEditSlashCommand || hasAddIntent;
      const isRemoveCommand = hasRemoveSlashCommand || hasRemoveIntent;
      
      let question = inputText;
      if (hasEditSlashCommand) {
        question = inputText.trim().substring(5).trim(); // Remove "/edit" and trim
      } else if (hasRemoveSlashCommand) {
        question = inputText.trim().substring(7).trim(); // Remove "/remove" and trim
      }

      const response = isProjectActionCommand
        ? await getAIAction(question, context)
        : isEditCommand
        ? await getAIEdit(question, context)
        : isRemoveCommand
        ? await getAIRemove(question, context)
        : await getAIExplanation(question, context);

      // Handle remove command
      if (isRemoveCommand && onRemoveRung && currentRoutine) {
        try {
          // Parse the JSON response - expecting { rungNumber: number } or { error: string }
          const parsed = JSON.parse(response);
          
          // Check if AI returned an error
          if (parsed.error) {
            const assistantMessage: Message = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: `❌ ${parsed.error}\n\nTip: Try being more specific, like "remove rung 0" or "remove the MOV instruction"`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
            return;
          }
          
          if (typeof parsed.rungNumber !== 'number') {
            throw new Error('Expected rungNumber field in response');
          }

          // Remove the rung
          onRemoveRung(currentRoutine.program, currentRoutine.name, parsed.rungNumber);

          // Show success message
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `✅ Successfully removed rung ${parsed.rungNumber} from ${currentRoutine.name}!`,
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, assistantMessage]);
        } catch (parseError) {
          toast({
            variant: "destructive",
            description: parseError instanceof Error 
              ? `Failed to parse removal request: ${parseError.message}`
              : "Invalid JSON response from AI",
          });

          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `❌ Error: ${parseError instanceof Error ? parseError.message : 'Invalid JSON response'}\n\n${response}`,
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, assistantMessage]);
        }
      }
      // Handle edit command - add new rung
      else if (isEditCommand && onAddRung && currentRoutine) {
        try {
          // Parse the JSON response
          const parsed = JSON.parse(response);
          
          // Validate that parsed is an array
          if (!Array.isArray(parsed)) {
            throw new Error('Expected JSON array of ladder logic instructions');
          }

          // Validate that each element has a type field
          for (const element of parsed) {
            if (!element || typeof element !== 'object' || !element.type) {
              throw new Error('Invalid ladder logic instruction format');
            }
          }
          
          // Calculate the next rung number
          const nextRungNumber = currentRoutine.rungs 
            ? Math.max(...currentRoutine.rungs.map(r => r.number), 0) + 1
            : 0;

          // Create the new rung
          const newRung = {
            number: nextRungNumber,
            text: `Generated from: ${question}`,
            parsed: parsed,
          };

          // Add the rung to the routine
          onAddRung(currentRoutine.program, currentRoutine.name, newRung);

          // Show a success message instead of the raw JSON
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `✅ Successfully added rung ${nextRungNumber} to ${currentRoutine.name}!\n\nThe new ladder logic has been added to the routine.`,
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, assistantMessage]);
        } catch (parseError) {
          // Show a user-friendly error message
          toast({
            variant: "destructive",
            description: parseError instanceof Error 
              ? `Failed to parse ladder logic: ${parseError.message}`
              : "Invalid JSON response from AI",
          });

          // Show the error in the chat as well
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `❌ Error: ${parseError instanceof Error ? parseError.message : 'Invalid JSON response'}\n\n${response}`,
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, assistantMessage]);
        }
      }
      // Handle project action command (create program, routine, tag, etc.)
      else if (isProjectActionCommand) {
        try {
          const parsed = JSON.parse(response);
          
          // Check if AI returned an error
          if (parsed.error) {
            const assistantMessage: Message = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: `❌ ${parsed.error}`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
            return;
          }
          
          let successMessage = "";
          
          if (parsed.action === "createProgram" && onCreateProgram) {
            if (!parsed.programName) {
              throw new Error("Missing program name for createProgram action");
            }
            onCreateProgram(parsed.programName, parsed.routineName || "Main");
            successMessage = `✅ Created new program "${parsed.programName}" with routine "${parsed.routineName || 'Main'}"!`;
          } else if (parsed.action === "createRoutine" && onCreateRoutine) {
            if (!parsed.routineName) {
              throw new Error("Missing routine name for createRoutine action");
            }
            let targetProgram = parsed.programName;
            if (parsed.programName === "CURRENT_PROGRAM") {
              if (!currentRoutine) {
                throw new Error("No program selected. Please select a program first or specify the program name.");
              }
              targetProgram = currentRoutine.program;
            }
            if (!targetProgram) {
              throw new Error("Missing program name for createRoutine action");
            }
            onCreateRoutine(targetProgram, parsed.routineName);
            successMessage = `✅ Created new routine "${parsed.routineName}" in program "${targetProgram}"!`;
          } else if (parsed.action === "createTag" && onCreateTag) {
            if (!parsed.tagName) {
              throw new Error("Missing tag name for createTag action");
            }
            const scope = (parsed.scope || "controller") as "controller" | "program";
            if (scope === "program" && !parsed.programName) {
              throw new Error("Missing program name for program-scoped tag");
            }
            const tagData = {
              name: parsed.tagName,
              dataType: parsed.dataType || "BOOL",
              scope,
              programName: scope === "program" ? parsed.programName : undefined,
            };
            onCreateTag(tagData);
            successMessage = `✅ Created new ${tagData.dataType} tag "${tagData.name}" (${tagData.scope} scope)!`;
          } else if (parsed.action === "renameProgram" && onRenameProgram) {
            if (!parsed.oldName || !parsed.newName) {
              throw new Error("Missing old or new name for renameProgram action");
            }
            onRenameProgram(parsed.oldName, parsed.newName);
            successMessage = `✅ Renamed program "${parsed.oldName}" to "${parsed.newName}"!`;
          } else if (parsed.action === "renameRoutine" && onRenameRoutine) {
            if (!parsed.programName || !parsed.oldName || !parsed.newName) {
              throw new Error("Missing program name, old name, or new name for renameRoutine action");
            }
            onRenameRoutine(parsed.programName, parsed.oldName, parsed.newName);
            successMessage = `✅ Renamed routine "${parsed.oldName}" to "${parsed.newName}"!`;
          } else {
            successMessage = `❌ Unknown action or missing handler for: ${parsed.action}`;
          }
          
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: successMessage,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        } catch (parseError) {
          toast({
            variant: "destructive",
            description: parseError instanceof Error 
              ? `Failed to parse action: ${parseError.message}`
              : "Invalid JSON response from AI",
          });

          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `❌ Error: ${parseError instanceof Error ? parseError.message : 'Invalid JSON response'}\n\n${response}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
      } else {
        // Normal explanation message
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to get AI response",
      });

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-chart-1" />
          <h2 className="text-lg font-semibold text-foreground">Ask the PLC</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {currentRoutine 
            ? `Discussing: ${currentRoutine.name}` 
            : "Select a routine to start asking questions"}
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/30 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
            <div className="text-sm text-center max-w-xs">
              <p className="font-medium mb-2">Welcome to Ask the PLC!</p>
              <p className="text-xs mb-3">
                I can help you learn, create, and edit your ladder logic using natural language.
              </p>
              <div className="text-xs space-y-1.5 text-left bg-muted/50 p-2 rounded">
                <p className="font-medium">Try saying:</p>
                <p>• "What does this routine do?"</p>
                <p>• "Add a rung with XIC for Start"</p>
                <p>• "Remove the MOV block"</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${message.role}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  <div className={`text-xs mt-1 ${
                    message.role === 'user' 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg p-3 bg-card border border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-border bg-card flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the PLC program..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            data-testid="input-chat-message"
          />
          <Button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            size="default"
            data-testid="button-send-message"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
