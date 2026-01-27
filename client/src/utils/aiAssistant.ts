export interface AIContext {
  fullProject?: any;
  currentRoutine?: {
    program: string;
    name: string;
    rungs?: Array<{ number: number; text: string; parsed: any[] }>;
  };
}

export async function getAIExplanation(
  question: string,
  context: AIContext
): Promise<string> {
  try {
    const response = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, context }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.response || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('AI Assistant Error:', error);
    throw new Error(
      `Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getAIEdit(
  question: string,
  context: AIContext
): Promise<string> {
  try {
    const response = await fetch('/api/ai/edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, context }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.response || '{"error": "Could not parse request."}';
  } catch (error) {
    console.error('AI Edit Error:', error);
    throw new Error(
      `Failed to get AI edit response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getAIRemove(
  question: string,
  context: AIContext
): Promise<string> {
  try {
    const response = await fetch('/api/ai/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, context }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.response || '{"error": "Could not parse request."}';
  } catch (error) {
    console.error('AI Remove Error:', error);
    throw new Error(
      `Failed to get AI remove response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getAIAction(
  question: string,
  context: AIContext
): Promise<string> {
  try {
    const response = await fetch('/api/ai/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, context }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.response || '{"error": "Could not parse request."}';
  } catch (error) {
    console.error('AI Action Error:', error);
    throw new Error(
      `Failed to get AI action response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
