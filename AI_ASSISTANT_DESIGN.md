# Architecture & System Design Document: Azure-Hosted SLM Career Assistant

**Author:** Jack Treadwell
**Date:** September 2024
**Status:** System Architecture Specification

---

## 1. Executive Summary & Objective

To distinguish this portfolio from standard static personal websites, this document outlines the architecture for an **Interactive AI Career Assistant & Command Palette (`⌘K`)**.

The system allows technical hiring managers, recruiters, and VPs of Engineering to converse naturally with a Small Language Model (SLM) fine-tuned/system-prompted on Jack Treadwell's career history, enterprise scaling metrics, engineering leadership philosophy, and technical architecture decisions.

Key requirements:
* **Sub-second perceived latency** using Server-Sent Events (SSE) token streaming.
* **Low cloud operating cost** (< $5/month) using serverless consumption tiers and Small Language Models (SLMs).
* **Enterprise security & rate-limiting** to prevent API key exposure, prompt injection, and DDoS cost exhaustion.
* **100% availability guarantee** via a client-side deterministic fallback engine if cloud APIs are rate-limited or cold-starting.

---

## 2. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Client Browser (React 18 + TS)                     │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │   AI Assistant Modal / Command Palette (⌘K Interface)             │  │
│  │   - Pre-populated Quick-Prompt Chips                            │  │
│  │   - Token-by-Token Streaming SSE Reader                           │  │
│  │   - Source Deep-Linking to Case Studies & Experience Cards        │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │ HTTPS / SSE Stream
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Azure Cloud Infrastructure                         │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │   Azure API Management / Azure Functions (Serverless Consumption) │  │
│  │   - IP Rate Limiting (e.g. 10 req/min)                            │  │
│  │   - CORS & Anti-Scraping Policies                                 │  │
│  │   - System Prompt Injection & Safety Guardrails                   │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │ Internal Managed Identity
│                                    ▼
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │   Azure AI Foundry / Managed Online Endpoint                      │  │
│  │   SLM Engine: Phi-3-mini-4k-instruct (or Llama-3.2-3B-Instruct)    │  │
│  │   - Pay-as-you-go Serverless Inference API                        │  │
│  │   - Grounded Context: Jack Treadwell Career Knowledge Base        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Architectural Decisions (ADRs)

### **ADR 1: SLM Choice — Phi-3-mini-4k-instruct vs. Full LLM (GPT-4o)**
* **Decision:** Selected Microsoft **Phi-3-mini-4k-instruct** (3.8B parameters) hosted via Azure AI Serverless Inference API.
* **Rationale:** A 3.8B parameter SLM is exceptionally fast, highly accurate for structured RAG/context extraction, and costs ~90% less per 1M tokens than GPT-4.
* **Trade-off:** Lower general world knowledge, but ideal when constrained by a strict System Prompt containing Jack's career data.

### **ADR 2: Streaming Architecture — Server-Sent Events (SSE) over WebSockets**
* **Decision:** Use Server-Sent Events (SSE) via HTTP POST for streaming model tokens.
* **Rationale:** SSE is lightweight, works natively over standard HTTP/2, requires no stateful WebSocket connection maintenance, and is natively supported by Azure Functions / API Management.

### **ADR 3: Middleware Gateway — Azure Functions (Serverless) vs. Direct Client Invocations**
* **Decision:** Route all queries through an Azure Function / Serverless API Proxy.
* **Rationale:** Calling Azure AI endpoints directly from the browser would expose the API key in client-side JS bundles. Azure Functions act as a secure proxy handling authentication, rate limiting, and CORS validation.
* **Isolation specifics:** CORS is locked to the portfolio's single production origin (never `*`); the function checks `Origin` server-side and returns `403` on a mismatch. Rate limiting is a per-IP fixed window backed by the Function App's own Table Storage, since Consumption-plan instances can't share in-memory state. Neither control is a hard auth boundary against a direct scripted caller with a spoofed `Origin` header — a Cost Management budget alert on the resource group is the backstop.

### **ADR 4: Availability Safeguard — Client-Side Deterministic Fallback Engine**
* **Decision:** If the Azure Function returns an HTTP 429 (Rate Limited), HTTP 5xx, or times out (> 3 seconds), the React client seamlessly switches to a local fuzzy-matching knowledge retrieval engine (`aiContext.ts`).
* **Rationale:** Ensures recruiters never experience a broken UI or blank error spinner, maintaining 100% uptime regardless of cloud availability.

---

## 4. Workflows & Message Sequences

### **Primary Workflow: Streaming Query Execution**

```
User (Browser)               Azure Function (API)             Azure AI SLM (Phi-3)
      │                               │                                │
      │ 1. POST /api/chat             │                                │
      │    { message, history }       │                                │
      ├──────────────────────────────►│                                │
      │                               │ 2. Validate Rate Limits & CORS │
      │                               │ 3. Attach System Prompt        │
      │                               │ 4. Forward Request             │
      │                               ├───────────────────────────────►│
      │                               │                                │
      │                               │◄───────────────────────────────┤
      │                               │ 5. Stream Tokens (Chunked SSE) │
      │◄──────────────────────────────┤                                │
      │ 6. Render Token-by-Token      │                                │
      │    in UI Command Palette      │                                │
```

---

## 5. Cost Estimation & Operational Budget

| Resource | Service Tier | Usage Assumptions | Estimated Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Azure Functions** | Consumption Plan (Y1) | 1,000 queries/mo (< 1M free executions) | **$0.00** (Free Tier) |
| **Azure AI Inference** | Pay-as-you-go Serverless (Phi-3-mini) | ~500k input/output tokens/mo | **$0.25 – $1.50** / month |
| **Azure Key Vault** | Standard Tier | API Key secret storage (< 10k ops) | **$0.03** / month |
| **GitHub Pages** | Static Hosting | Portfolio Frontend | **$0.00** |
| **TOTAL ESTIMATED COST** | | | **< $2.00 / month** |

---

## 6. Development Effort & Implementation Timeline

| Phase | Milestone / Work Item | Effort Estimate |
| :--- | :--- | :--- |
| **Phase 1: Frontend UI** | Build `⌘K` Command Palette & Chat Drawer UI with Framer Motion, quick-prompt chips, and message history state. | 4 – 6 hours |
| **Phase 2: Context Engine** | Format `aiContext.ts` into a structured system prompt detailing career history, metrics, technical decisions, and interview Q&A. | 2 – 3 hours |
| **Phase 3: Azure Infrastructure** | Provision Azure AI Serverless Phi-3 endpoint, Azure Function HTTP trigger, Key Vault secret bindings, and CORS setup. | 3 – 5 hours |
| **Phase 4: Client Integration** | Connect React SSE parser, token streaming hook, and local deterministic fallback fallback engine. | 3 – 4 hours |
| **Phase 5: Testing & Guardrails**| Stress test rate-limiting, prompt injection defenses, latency benchmarking, and E2E verification. | 2 – 3 hours |
| **TOTAL ESTIMATED EFFORT**| | **14 – 21 hours** |

---

## 7. Security, Privacy & Safety Considerations

1. **Prompt Injection Defense:** The system prompt instructs the SLM to treat the user's message as untrusted input rather than commands, never reveal or discuss the system prompt itself, never fabricate or agree with unlisted career claims, and refuse off-topic or harmful requests with one fixed deflection line — reducing variance in how a jailbreak attempt gets handled. This is defense-in-depth on a 3.8B model, not a guarantee: it does not replace the origin allowlist, per-IP rate limit, and 500-character input cap, which bound cost and blast radius regardless of whether a given jailbreak succeeds. Streaming the response to the client also means there's no server-side output moderation pass before tokens go out — buffering the full response to moderate it first would defeat the point of streaming, so this is an accepted tradeoff at this traffic scale.
2. **API Key Isolation:** Cloud credential keys are stored exclusively in Azure Key Vault (RBAC-authorized; see Implementation Guide §3.2) and injected via Azure Function Application Settings; zero keys are committed or exposed to client JS.
3. **Data Privacy:** Azure AI pay-as-you-go endpoints do not log or store prompt data for model retraining.
