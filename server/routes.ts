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

  // AI Remove endpoint - Natural Language to rung removal translator
  app.post("/api/ai/remove", async (req, res) => {
    try {
      const { question, context } = req.body;

      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      const systemPrompt = `You are a silent code translation engine. Your only job is to translate a user's removal request into a JSON object indicating which rung to remove.

CRITICAL RULES:

JSON ONLY: Your entire response must be only raw JSON. DO NOT include any conversational text, explanations, markdown, or apologies.

OUTPUT FORMAT: {"rungNumber": N} where N is the rung number to remove

SMART DEFAULTS:
- If the user says "remove it", "delete it", or uses vague pronouns, AND there is only ONE rung, remove that rung
- If there are multiple rungs and the request is vague, return an error asking for clarification

ERROR HANDLING: If you cannot determine which rung to remove AND there are multiple rungs, respond with: {"error": "Please specify which rung or instruction to remove."}

EXAMPLES:

Example 1:
User: "remove rung 0"
Your Response: {"rungNumber": 0}

Example 2:
User: "delete the rung with ProgramTwoSINT.0"
Context shows rung 0 has an OTE instruction for ProgramTwoSINT.0
Your Response: {"rungNumber": 0}

Example 3:
User: "get rid of the XIO instruction"
Context shows rung 0 has an XIO instruction
Your Response: {"rungNumber": 0}

Example 4:
User: "remove it" or "I want you to remove it"
Context shows there is only 1 rung (rung 0)
Your Response: {"rungNumber": 0}

Example 5:
User: "remove the MOV block"
Context shows rung 0 has a MOV instruction
Your Response: {"rungNumber": 0}

CONTEXT: You will be given the current routine's rungs. Analyze them to determine which rung the user wants to remove based on their description.`;

      const userPrompt = `User's Request: ${question}

${context?.currentRoutine ? `
Current Routine Context:
Program: ${context.currentRoutine.program}
Routine: ${context.currentRoutine.name}
${context.currentRoutine.rungs ? `
Rungs in this Routine:
${context.currentRoutine.rungs.map((r: any) => `Rung ${r.number}: ${r.text}`).join('\n')}
` : ''}
` : ''}

Determine which rung number to remove based on the user's request.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.0,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content || '{"error": "Could not determine which rung to remove."}';

      res.json({ response });
    } catch (error) {
      console.error("AI Remove Error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get AI remove response' 
      });
    }
  });

  // AI Edit endpoint - Natural Language to JSON translator
  app.post("/api/ai/edit", async (req, res) => {
    try {
      const { question, context } = req.body;

      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      const systemPrompt = `You are a silent code translation engine. Your only job is to translate a user's natural language request into a valid JSON object or an array of JSON objects that represent Rockwell ladder logic instructions.

CRITICAL RULES:

JSON ONLY: Your entire response must be only the raw JSON. DO NOT include any conversational text, explanations, markdown (like \`\`\`json), or apologies.

MATCH THE STRUCTURE: The JSON you generate must match the exact structure our application's parser uses.

ERROR HANDLING: If you cannot understand the request or it's invalid, you must respond with exactly this JSON: {"error": "Could not parse request."}

EXAMPLES:

Example 1:
User: "add a rung with an XIC for 'Start' and an OTE for 'Motor'"
Your Response: [{"type":"XIC","tag":"Start"},{"type":"OTE","tag":"Motor"}]

Example 2:
User: "add a MOV instruction to move the value 100 into 'MyDINT'"
Your Response: [{"type":"MOV","source":"100","dest":"MyDINT"}]

Example 3:
User: "a branch with 'Auto' on top and 'Manual' on the bottom, then a 'Cycle_Run' output"
Your Response: [{"type":"Branch","branches":[[{"type":"XIC","tag":"Auto"}],[{"type":"XIC","tag":"Manual"}]]},{"type":"OTE","tag":"Cycle_Run"}]

CONTEXT: You will be given the full project's parsed JSON as context. Use it to validate that the tag names and routine names the user mentions are valid.`;

      const userPrompt = `User's Request: ${question}

${context?.fullProject ? `
Full Project Context:
Controller: ${context.fullProject.controllerName}
Controller Tags: ${context.fullProject.controllerTags.slice(0, 50).join(', ')}${context.fullProject.controllerTags.length > 50 ? '...' : ''}
Programs: ${context.fullProject.programs.map((p: any) => p.name).join(', ')}
` : ''}

${context?.currentRoutine ? `
Currently Editing Routine:
Program: ${context.currentRoutine.program}
Routine: ${context.currentRoutine.name}
${context.currentRoutine.rungs ? `
Existing Rungs: ${context.currentRoutine.rungs.length}
` : ''}
` : ''}

Generate only the JSON structure for the ladder logic instructions.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.0,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content || '{"error": "Could not parse request."}';

      res.json({ response });
    } catch (error) {
      console.error("AI Edit Error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get AI edit response' 
      });
    }
  });

  app.post("/api/ai/action", async (req, res) => {
    try {
      const { question, context } = req.body;

      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      const systemPrompt = `You are a project management engine for PLC ladder logic projects. Your job is to translate a user's natural language request into a JSON action object.

CRITICAL RULES:

JSON ONLY: Your entire response must be only the raw JSON. DO NOT include any conversational text, explanations, markdown, or apologies.

ACTION TYPES:
1. Create a new program: {"action": "createProgram", "programName": "NAME", "routineName": "Main"}
2. Create a new routine: {"action": "createRoutine", "programName": "EXISTING_PROGRAM", "routineName": "NEW_ROUTINE_NAME"}
3. Create a new tag: {"action": "createTag", "tagName": "NAME", "dataType": "BOOL|DINT|REAL|SINT|INT|STRING|TIMER|COUNTER", "scope": "controller|program", "programName": "PROGRAM_IF_PROGRAM_SCOPE"}
4. Rename program: {"action": "renameProgram", "oldName": "OLD", "newName": "NEW"}
5. Rename routine: {"action": "renameRoutine", "programName": "PROGRAM", "oldName": "OLD", "newName": "NEW"}

ERROR HANDLING: If you cannot understand the request, respond with: {"error": "Could not understand the request. Please try rephrasing."}

SMART DEFAULTS:
- For new programs, always include a default routine named "Main" unless specified otherwise
- For tags, default to "BOOL" type and "controller" scope unless specified
- Use PascalCase for names (e.g., "MyNewProgram", "StartSequence")

EXAMPLES:

User: "create a new program called Conveyor"
Response: {"action": "createProgram", "programName": "Conveyor", "routineName": "Main"}

User: "add a routine named Startup to MainProgram"
Response: {"action": "createRoutine", "programName": "MainProgram", "routineName": "Startup"}

User: "create a DINT tag called MotorSpeed"
Response: {"action": "createTag", "tagName": "MotorSpeed", "dataType": "DINT", "scope": "controller"}

User: "add a boolean tag for pump status in the Pumps program"
Response: {"action": "createTag", "tagName": "PumpStatus", "dataType": "BOOL", "scope": "program", "programName": "Pumps"}

User: "make a new routine for handling alarms"
Response: {"action": "createRoutine", "programName": "CURRENT_PROGRAM", "routineName": "AlarmHandler"}

CONTEXT: You will be given the full project context. Use existing program names when creating routines. If no program is specified for a routine, use "CURRENT_PROGRAM" as a placeholder.`;

      const userPrompt = `User's Request: ${question}

${context?.fullProject ? `
Full Project Context:
Controller: ${context.fullProject.controllerName}
Controller Tags: ${context.fullProject.controllerTags.slice(0, 50).join(', ')}${context.fullProject.controllerTags.length > 50 ? '...' : ''}
Programs: ${context.fullProject.programs.map((p: any) => `${p.name} (routines: ${p.routines.map((r: any) => r.name).join(', ')})`).join('; ')}
` : ''}

${context?.currentRoutine ? `
Currently Selected:
Program: ${context.currentRoutine.program}
Routine: ${context.currentRoutine.name}
` : ''}

Generate the JSON action object for this request.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.0,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content || '{"error": "Could not parse request."}';

      res.json({ response });
    } catch (error) {
      console.error("AI Action Error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get AI action response' 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
