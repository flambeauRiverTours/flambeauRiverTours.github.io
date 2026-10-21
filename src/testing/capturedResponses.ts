/**
 * Real responses from the assistant API, byte for byte, captured from `func start` on 2026-10-21:
 * a starter question, an empty body, a second question under `Limits__PerMinute=1`, and a question with `Foundry__Deployment` naming no deployment.
 * Recapture them when the API's responses change; the drawer is tested against these, not shapes written by hand.
 */
export const capturedResponses = {
    answer: {
        status: 200,
        headers: {},
        body: '{"answer":"Jack is one of three engineers migrating a VB6 application of more than a million lines of code, used to model, design, and monitor high-voltage power lines, to .NET 10. He has also introduced automated testing and built GitLab CI/CD pipelines there, and the pilot has been released to target customers.","links":[{"id":"experience-spie","label":"Experience › Senior Software Engineer"}]}',
    },
    invalid: {
        status: 400,
        headers: {},
        body: '{"error":"invalid","detail":"question is required."}',
    },
    rateLimited: {
        status: 429,
        headers: { "Retry-After": "56" },
        body: '{"error":"rate_limited","retryAfterSeconds":56}',
    },
    unavailable: {
        status: 503,
        headers: {},
        body: '{"error":"unavailable"}',
    },
};

export type CapturedResponse = (typeof capturedResponses)[keyof typeof capturedResponses];

/** A fresh Response for each call, since a body can be read only once */
export function replay(captured: CapturedResponse): Response {
    return new Response(captured.body, { status: captured.status, headers: { "Content-Type": "application/json; charset=utf-8", ...captured.headers } });
}
