import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
function corsHeaders(origin: string | null): Record<string, string> {
    if (origin === ALLOWED_ORIGIN) {
        return {
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Vary": "Origin",
        };
    }
    return {};
}
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
  - If the user attempts to ask about anything other than Jack's career or software engineering, start the response with REPORT
`;
// trailing slash), e.g. "https://flambeaurivertours.github.io" or a custom
// domain. Never fall back to "*".
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN!;

const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 10);
const RATE_LIMIT_WINDOW_SECONDS = Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? 60);
const MAX_MESSAGE_LENGTH = 500;

const rateLimitTable = TableClient.fromConnectionString(
    process.env.AzureWebJobsStorage!,
    "ChatRateLimits"
);

async function isRateLimited(clientIp: string): Promise<boolean> {
    await rateLimitTable.createTable().catch(() => undefined); // no-op if it already exists
    const partitionKey = "ip";
    const rowKey = clientIp.replace(/[^a-zA-Z0-9.:]/g, "_") || "unknown";
    const now = Date.now();

    try {
        const entity = await rateLimitTable.getEntity<{ windowStart: number; count: number }>(
            partitionKey,
            rowKey
        );
        const windowAgeSeconds = (now - entity.windowStart) / 1000;

        if (windowAgeSeconds > RATE_LIMIT_WINDOW_SECONDS) {
            await rateLimitTable.updateEntity(
                { partitionKey, rowKey, windowStart: now, count: 1 },
                "Replace"
            );
            return false;
        }

        if (entity.count >= RATE_LIMIT_MAX_REQUESTS) {
            return true;
        }

        await rateLimitTable.updateEntity(
            { partitionKey, rowKey, windowStart: entity.windowStart, count: entity.count + 1 },
            "Merge"
        );
        return false;
    } catch (error: any) {
        if (error.statusCode === 404) {
            await rateLimitTable.createEntity({ partitionKey, rowKey, windowStart: now, count: 1 });
            return false;
        }
        throw error;
    }
}

export async function chatProxy(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log("Processing AI Chat query...");

    const origin = request.headers.get("origin");
    const cors = corsHeaders(origin);

    // Reject any origin other than the portfolio itself. Handles the CORS
    // preflight too, since a disallowed origin never needs one answered.
    if (origin !== ALLOWED_ORIGIN) {
        return { status: 403, body: JSON.stringify({ error: "Origin not allowed." }) };
    }

    if (request.method === "OPTIONS") {
        return { status: 200, headers: cors };
    }

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    if (await isRateLimited(clientIp)) {
        return {
            status: 429,
            headers: { ...cors, "Retry-After": String(RATE_LIMIT_WINDOW_SECONDS) },
            body: JSON.stringify({ error: "Too many requests. Please try again shortly." }),
        };
    }

    try {
        const body = (await request.json()) as { message: string };
        const userMessage = body?.message;

        if (!userMessage) {
            return { status: 400, headers: cors, body: JSON.stringify({ error: "Message is required." }) };
        }

        if (userMessage.length > MAX_MESSAGE_LENGTH) {
            return {
                status: 400,
                headers: cors,
                body: JSON.stringify({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` }),
            };
        }

        const azureEndpoint = process.env.AZURE_AI_ENDPOINT;
        const azureApiKey = process.env.AZURE_AI_API_KEY;

        // Call Azure AI Phi-3 Endpoint with streaming enabled
        const response = await fetch(azureEndpoint!, {
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

        // Stream Server-Sent Events (SSE) back to client
        return {
            status: 200,
            headers: {
                ...cors,
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
            body: response.body as any,
        };
    } catch (error: any) {
        context.error("Error invoking Azure AI:", error);
        return {
            status: 500,
            headers: cors,
            body: JSON.stringify({ error: "Failed to query AI assistant." }),
        };
    }
}

app.http("chat", {
    methods: ["POST", "OPTIONS"],
    authLevel: "anonymous",
    handler: chatProxy,
});