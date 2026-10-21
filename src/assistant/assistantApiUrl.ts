/**
 * The deployed API's address; the assistant stays hidden while it's unset (until the soft launch, task 4.8).
 * Its own module so the page can check it without loading the API client, which stays in the drawer's chunk.
 */
export const assistantApiUrl: string | undefined = import.meta.env.VITE_ASSISTANT_API_URL || undefined;
