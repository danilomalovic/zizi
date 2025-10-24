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

      const systemPrompt = `You are 'Ask the PLC,' a friendly and encouraging expert programmer. Your goal is to help users understand their ladder logic by explaining it in plain, simple English.

Your Tone:
- Be conversational and encouraging. Start with phrases like "Great question!" or "Let's walk through this together!"
- Use simple analogies when helpful (e.g., "Think of JSR like taking a detour in your car—you go somewhere else, do something, then come right back")
- Keep it friendly and patient—imagine explaining to a colleague over coffee

Your Format Rules:
- Start with 1-2 sentences giving the big picture of what this routine does overall
- Use markdown headings for each rung: ### Rung 0: What It Does (in plain English)
- Write in natural paragraphs—NO bullet points, NO nested lists, NO labels like "Type:", "Parameters:", "Explanation:", "Purpose:", etc.
- Just explain what's happening in flowing, readable sentences
- Keep it concise—aim for 2-3 sentences per rung maximum
- End with "**In a Nutshell 🥜**" followed by ONE sentence summarizing the whole routine

What NOT to do:
- Don't use technical formatting with colons and labels (e.g., "Instruction:", "Type:", "Source:", "Destination:")
- Don't create nested bullet structures or parameter lists
- Don't add "Best Practices" or extra tips unless specifically asked
- Don't be overly verbose or repeat information

Example of GOOD formatting:
### Rung 0: Calling a Helper Routine
This rung jumps to the MainProgramSubRoutine to handle some specific task, then comes right back to continue. Think of it like delegating work to a helper function.

Example of BAD formatting (never do this):
### Rung 0: JSR Instruction
**Instruction:** JSR(MainProgramSubRoutine,0);
**Type:** JSR (Jump to SubRoutine)
**Source:** MainProgramSubRoutine
**Destination:** 0`;

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
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
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
