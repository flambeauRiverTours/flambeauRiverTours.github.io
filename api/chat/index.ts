import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

const SYSTEM_PROMPT = `
You are Jack Treadwell's AI Career Assistant embedded on his personal portfolio site.
Your goal is to provide concise, factual, and professional answers about Jack's engineering background.

Key Facts:
- Former Software Developer Team Lead at Epic Systems (managed 9 software engineers).
- Scaled high-concurrency physician billing & regulatory engines handling 3M+ monthly transactions.
- Engineered rapid telehealth billing workflows during COVID-19 pandemic serving 1.5M+ monthly transactions.
- Holds AWS Certified Solutions Architect - Associate, CKAD (Certified Kubernetes Application Developer), and CSM certifications.
- Located in Berlin, Germany. Open to Senior & Lead Software Engineering roles.

Instructions:
- Keep responses under 4 sentences unless asked for deep technical details.
- Always maintain a professional, confident tone.
- Do NOT answer questions unrelated to Jack's career or software engineering.
`;

export async function chatProxy(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Processing AI Chat query via Azure Function...");

  if (request.method === "OPTIONS") {
    return {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  }

  try {
    const body = (await request.json()) as { message: string };
    const userMessage = body?.message;

    if (!userMessage) {
      return {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Message is required." })
      };
    }

    const azureEndpoint = process.env.AZURE_AI_ENDPOINT;
    const azureApiKey = process.env.AZURE_AI_API_KEY;

    if (!azureEndpoint || !azureApiKey) {
      context.log("Azure AI credentials missing, fallback mode.");
      return {
        status: 503,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Azure AI Service Credentials Not Configured" }),
      };
    }

    const response = await fetch(azureEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${azureApiKey}`,
      },
      body: JSON.stringify({
        model: "phi-3-mini-serverless",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage }
        ],
        stream: true,
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Azure AI endpoint returned HTTP ${response.status}`);
    }

    return {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
      body: response.body as any,
    };
  } catch (error: any) {
    context.error("Error invoking Azure AI:", error);
    return {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to query AI assistant." }),
    };
  }
}

app.http("chat", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: chatProxy,
});
