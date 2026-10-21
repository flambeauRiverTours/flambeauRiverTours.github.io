import { describe, expect, it } from "vitest";
import productionEnv from "../.env.production?raw";

//the production build shows the assistant only when this is set, and askAssistant appends "/api/ask" to it
describe(".env.production", () => {
    const apiUrl = /^VITE_ASSISTANT_API_URL=(.*)$/m.exec(productionEnv)?.[1]?.trim();

    it("points the assistant at the deployed Function over https", () => {
        expect(apiUrl).toBe("https://func-jtassistant.azurewebsites.net");
    });

    it("has no trailing slash, so requests don't go to //api/ask", () => {
        expect(apiUrl?.endsWith("/")).toBe(false);
    });
});
