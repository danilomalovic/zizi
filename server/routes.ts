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
- Be conversational, helpful, and patient.
- Use phrases like "Great question!" or "Let's walk through this..."
- Use simple analogies to explain complex ideas (e.g., "Think of a JSR as a 'detour' for your code...").
- Be encouraging!

Your Structure:
- Start with a brief, high-level summary of what the routine does.
- Go rung-by-rung. Use a markdown heading for each rung (e.g., ### Rung 0: Jump to Subroutine).
- Explain both the "what" (what the instructions are, like LIM) and the "why" (what the rung is trying to achieve, like "a range check").
- DO NOT use a dry, fragmented structure like "Purpose:", "Outcome:", or "Practical Implications:".
- End with a very short "In a Nutshell 🥜" summary.`;

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
