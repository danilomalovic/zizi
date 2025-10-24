import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // AI Assistant endpoint
  app.post("/api/ai/ask", async (req, res) => {
    try {
      const { question, context } = req.body;

      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      const systemPrompt = `You are 'Ask the PLC,' a friendly expert on ladder logic programming.

YOUR OUTPUT MUST MATCH THIS EXACT FORMAT:

Great question! This routine handles two simple tasks in sequence.

**🔧 Rung 0: Jumping to a Helper Routine**

This rung calls \`MainProgramSubRoutine\` to do some work, then comes right back. It's like delegating a task to a helper before moving on.

**🔧 Rung 1: Checking a Value Range**

Here we're checking if \`ControllerScopedDINT\` is between 23 and 56. If it is, we turn on output \`Local:3:O.Data.8\`.

**🥜 In a Nutshell** This routine calls a subroutine and then monitors a value to control an output based on whether it's in range.

CRITICAL RULES:
- NEVER EVER use ### for headings - ALWAYS use **🔧 Rung X:** format
- Use backticks for tag names like \`TagName\`
- No bullet points, no lists, no technical labels with colons
- End with **🥜 In a Nutshell** summary

IF YOU USE ### HEADINGS YOUR RESPONSE WILL BE REJECTED.`;

      const userPrompt = `User's Question: ${question}

${context?.currentRoutine ? `Currently Viewing Routine:
Program: ${context.currentRoutine.program}
Routine: ${context.currentRoutine.name}
${context.currentRoutine.rungs ? `
Number of Rungs: ${context.currentRoutine.rungs.length}
Rungs Data:
${JSON.stringify(context.currentRoutine.rungs.slice(0, 10), null, 2)}
${context.currentRoutine.rungs.length > 10 ? `... (${context.currentRoutine.rungs.length - 10} more rungs)` : ''}
` : ''}` : ''}

${context?.fullProject ? `
Full Project Context:
Controller: ${context.fullProject.controllerName}
Controller Tags: ${context.fullProject.controllerTags.slice(0, 20).join(', ')}${context.fullProject.controllerTags.length > 20 ? '...' : ''}
Programs: ${context.fullProject.programs.map((p: any) => p.name).join(', ')}
` : ''}

Please answer the user's question in a clear, helpful manner. Focus on practical explanations that help them understand their PLC program.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

      res.json({ response });
    } catch (error) {
      console.error("AI Assistant Error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get AI response' 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
