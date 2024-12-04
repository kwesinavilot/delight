interface ChatSession {
  session: any;
  destroy: () => void;
}

export const initializeChatSession = async (): Promise<ChatSession | null> => {
  const { available } = await ai.languageModel.capabilities();
  
  if (available !== "no") {
    const session = await ai.languageModel.create({
      systemPrompt: "You are Delight, a helpful and friendly AI assistant."
    });
    return {
      session,
      destroy: () => session.destroy()
    };
  }
  return null;
};

export const generateChatResponse = async (
  session: any,
  message: string,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  let result = '';
  let previousChunk = '';

  const stream = await session.promptStreaming(message);

  for await (const chunk of stream) {
    const newChunk = chunk.startsWith(previousChunk)
      ? chunk.slice(previousChunk.length)
      : chunk;
    
    if (onChunk) {
      onChunk(newChunk);
    }
    
    result += newChunk;
    previousChunk = chunk;
  }

  return result;
};
