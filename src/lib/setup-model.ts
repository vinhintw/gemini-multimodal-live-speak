import { FunctionDeclaration } from "@google/generative-ai";

export interface Message {
  id: string;
  type: "user" | "assistant" | "function" | "error";
  content: string;
  timestamp: Date;
  functionName?: string;
  functionParams?: Record<string, any>;
  apiResponse?: any;
}

interface SetupModelParams {
  model?: string;
  system_instruction?: string;
  functionDeclarations?: FunctionDeclaration[];
  response_modalities?: string[];
  language_code?: string;
  voice_name?: string;
}

export const setupModel = ({
  model = "models/gemini-2.0-flash-exp",
  system_instruction = "You are a helpful assistant.",
  functionDeclarations = [],
  response_modalities = ["audio"],
  language_code = "cmn-CN",
  voice_name = "default",
}: SetupModelParams) => {
  const setupMessage = {
    setup: {
      model: model,
      system_instruction: {
        role: "user",
        parts: [{ text: system_instruction }],
      },
      tools: [
        {
          functionDeclarations: functionDeclarations,
        },
        {
          codeExecution: {},
        },
        {
          googleSearch: {},
        },
      ],
      generation_config: {
        response_modalities: response_modalities,
        speech_config: {
          language_code: language_code,
          voice_config: {
            prebuilt_voice_config: {
              voice_name: voice_name,
            },
          },
        },
      },
    },
  };
  return setupMessage;
};
