export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1];

  // Mock AI response
  const mockResponse = `Hello! I'm the Command Center AI assistant. You said: "${lastMessage?.content || 'nothing'}"\n\nThis is a mock response to verify the chat foundation is working correctly. The real AI integration will come in a future milestone. 🚀`;

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
