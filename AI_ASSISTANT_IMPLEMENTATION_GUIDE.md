# Step-by-Step Implementation Guide: Azure-Hosted SLM AI Assistant

**Author:** Jack Treadwell
**Reference Document:** `AI_ASSISTANT_DESIGN.md`
**Target Architecture:** Azure Functions (Serverless Node.js/TS) + Azure AI Foundry (Phi-3-mini-4k-instruct) + React 18 / TypeScript Frontend

---

## Overview

This guide provides an end-to-end, technical step-by-step procedure for provisioning, configuring, developing, and deploying the cloud-hosted Small Language Model (SLM) AI Assistant for the portfolio website.

---

## Step 1: Provision Azure AI Infrastructure & Deploy Phi-3 SLM

### **1.1. Create Resource Group & Azure AI Foundry Project**
1. Log in to the [Azure Portal](https://portal.azure.com/) or Azure CLI:
   ```bash
   az login
   az group create --name rg-portfolio-ai-prod --location westeurope
   ```
2. Navigate to **Azure AI Foundry** (`ai.azure.com`) and create a new Project:
   * **Project Name:** `proj-portfolio-slm`
   * **Region:** `westeurope` or `eastus` (select regions with Serverless Model API support).

### **1.2. Deploy Phi-3-mini Serverless Endpoint**
1. In Azure AI Foundry, navigate to **Model Catalog**.
2. Search for `Phi-3-mini-4k-instruct`.
3. Select **Deploy** ➔ **Serverless API (Pay-as-you-go)**.
4. Set Deployment Name: `phi-3-mini-serverless`.
5. Once deployment completes, copy the following credentials:
   * **Target Endpoint URL:** `https://phi-3-mini-serverless.<region>.inference.ai.azure.com/v1/chat/completions`
   * **Primary API Key:** *(Store securely for Step 2)*

---

## Step 2: Develop Azure Functions Serverless API Proxy

To prevent exposing the Azure AI API key in client-side JavaScript, build an Azure Function HTTP trigger that handles CORS, rate-limiting, system prompt injection, and SSE streaming.

### **2.1. Initialize Azure Functions Project**
```bash
mkdir api-chat-proxy
cd api-chat-proxy
func init --typescript
npm install @azure/app-configuration @azure/identity dotenv cors
```

### **2.2. Implement Streaming Function Code (`src/functions/chat.ts`)**
Create `src/functions/chat.ts`:

```typescript
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
  context.log("Processing AI Chat query...");

  // Handle CORS Preflight
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
      return { status: 400, body: JSON.stringify({ error: "Message is required." }) };
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
```

---

## Step 3: Configure Azure Function App & Key Vault

### **3.1. Deploy Azure Function App**
```bash
az functionapp create \
  --resource-group rg-portfolio-ai-prod \
  --consumption-plan-location westeurope \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name func-portfolio-ai-chat \
  --storage-account stportfolioaichat
```

### **3.2. Secure Key Vault Secret Binding**
1. Store Azure AI API Key in **Azure Key Vault**:
   ```bash
   az keyvault create --name kv-portfolio-ai --resource-group rg-portfolio-ai-prod
   az keyvault secret set --vault-name kv-portfolio-ai --name "AzureAIApiKey" --value "<YOUR_AZURE_AI_KEY>"
   ```
2. Enable Managed Identity on Function App & Grant Key Vault Reader permission:
   ```bash
   az functionapp identity assign --name func-portfolio-ai-chat --resource-group rg-portfolio-ai-prod
   ```
3. Set Application Settings in Azure Function App:
   * `AZURE_AI_ENDPOINT`: `https://phi-3-mini-serverless.westeurope.inference.ai.azure.com/v1/chat/completions`
   * `AZURE_AI_API_KEY`: `@Microsoft.KeyVault(SecretUri=https://kv-portfolio-ai.vault.azure.net/secrets/AzureAIApiKey/)`

---

## Step 4: Connect React Client Stream Reader

In the React portfolio application (`src/components/UI/AvatarSpeechModal.tsx`), update the submit handler to consume the SSE token stream with fallback handling.

### **4.1. Streaming Consumer Implementation (`src/services/aiStreamService.ts`)**

```typescript
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
    console.warn("Cloud SLM stream failed, triggering local fallback engine...", error);
    onError();
  }
}
```

---

## Step 5: Verification & End-to-End Testing

1. **Local Test Execution:**
   ```bash
   npm run test
   ```
2. **Production Bundle Compilation:**
   ```bash
   npm run build
   ```
3. **E2E Cloud Query Verification:**
   * Open local dev server (`npm run dev`).
   * Press `⌘K` or click avatar headshot to open Speech Popover.
   * Enter a query (e.g. *"How did Jack scale billing to 3M+ transactions?"*).
   * Verify token-by-token streaming renders smoothly.
   * Disconnect network to verify local fallback engine triggers gracefully.
