import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAIExplanation, getAIEdit, getAIRemove, type AIContext } from "@/utils/aiAssistant";
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
}

export function ChatPanel({ fullProject, currentRoutine, onAddRung, onRemoveRung }: ChatPanelProps) {
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

      // Check for special commands
      const isEditCommand = inputText.trim().startsWith('/edit');
      const isRemoveCommand = inputText.trim().startsWith('/remove');
      
      let question = inputText;
      if (isEditCommand) {
        question = inputText.trim().substring(5).trim(); // Remove "/edit" and trim
      } else if (isRemoveCommand) {
        question = inputText.trim().substring(7).trim(); // Remove "/remove" and trim
      }

      const response = isEditCommand
        ? await getAIEdit(question, context)
        : isRemoveCommand
        ? await getAIRemove(question, context)
        : await getAIExplanation(question, context);

      // Handle remove command
      if (isRemoveCommand && onRemoveRung && currentRoutine) {
        try {
          // Parse the JSON response - expecting { rungNumber: number }
          const parsed = JSON.parse(response);
          
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
                I can help you learn, create, and edit your ladder logic.
              </p>
              <div className="text-xs space-y-1 text-left bg-muted/50 p-2 rounded">
                <p className="font-medium">Commands:</p>
                <p>• Ask questions naturally</p>
                <p>• <span className="font-mono">/edit</span> - Create new rungs</p>
                <p>• <span className="font-mono">/remove</span> - Delete rungs</p>
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
