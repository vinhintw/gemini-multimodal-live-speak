export const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
export const endpoint = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
