/// <reference types="vite/client" />

interface ImportMetaEnv {
    //the assistant API's address; unset in production until the soft launch, which hides the assistant
    readonly VITE_ASSISTANT_API_URL?: string;
}
