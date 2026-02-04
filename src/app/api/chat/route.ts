export async function POST(req: Request) {
  const { messages, agentId } = await req.json();
  const lastMessage = messages[messages.length - 1];

  // Log the agentId for future gateway integration
  console.log(`[Chat API] Agent: ${agentId || 'not specified'}`);

  // Mock AI response - personalized per agent
  const agentResponses: Record<string, string> = {
    murphie: `Hey! Murphie here. You said: "${lastMessage?.content || 'nothing'}"\n\nI'm your QA specialist. Ready to help with testing, visual regression, and quality assurance. This is a mock response — real AI integration coming soon!`,
    eight: `Eight here. You said: "${lastMessage?.content || 'nothing'}"\n\nI handle dealership development and business logic. Mock response for now — stay tuned for the real deal!`,
    console: `Console reporting. You said: "${lastMessage?.content || 'nothing'}"\n\nDevOps is my game. Deployments, builds, and infrastructure — I've got it covered. Mock response for now!`,
    daily: `Daily Brief. You said: "${lastMessage?.content || 'nothing'}"\n\nI synthesize information and provide strategic summaries. This is a mock response — real AI integration coming soon!`,
  };

  const mockResponse = agentResponses[agentId] || 
    `Hello! I'm the Command Center AI assistant. You said: "${lastMessage?.content || 'nothing'}"\n\nThis is a mock response to verify the chat foundation is working correctly. The real AI integration will come in a future milestone.`;

  // Create a streaming response that mimics the Vercel AI SDK format
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Stream word by word for realistic effect
      const words = mockResponse.split(' ');
      for (const word of words) {
        // Vercel AI SDK data stream format: "0:" prefix for text chunks
        const chunk = `0:"${word.replace(/"/g, '\\"')} "\n`;
        controller.enqueue(encoder.encode(chunk));
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      // Finish tokens marker
      controller.enqueue(encoder.encode('e:{"finishReason":"stop","usage":{"promptTokens":10,"completionTokens":50}}\n'));
      controller.enqueue(encoder.encode('d:{"finishReason":"stop"}\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Vercel-AI-Data-Stream': 'v1',
    },
  });
}
