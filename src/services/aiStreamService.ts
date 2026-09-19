export async function streamAIChat(
  userQuery: string,
  onChunk: (token: string) => void,
  onError: () => void
): Promise<void> {
  const FUNCTION_URL = import.meta.env.VITE_AZURE_FUNCTION_URL || "https://func-portfolio-ai-chat.azurewebsites.net/api/chat";

  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userQuery }),
    });

    if (!response.ok || !response.body) {
      throw new Error("Cloud stream response error");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ") && !line.includes("[DONE]")) {
          try {
            const data = JSON.parse(line.replace("data: ", ""));
            const token = data.choices[0]?.delta?.content || "";
            if (token) onChunk(token);
          } catch (e) {
            // Ignore partial SSE chunk parse errors
          }
        }
      }
    }
  } catch (error) {
    console.warn("Cloud SLM stream unavailable, triggering local fallback engine...", error);
    onError();
  }
}
