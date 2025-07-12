import { useState, useRef, useCallback } from "react";
import { Message } from "@/lib/setup-model";

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messageCounterRef = useRef(0);

  const addMessage = useCallback(
    (message: Omit<Message, "id" | "timestamp">) => {
      messageCounterRef.current += 1;
      const newMessage: Message = {
        ...message,
        id: `msg-${Date.now()}-${messageCounterRef.current}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    messageCounterRef.current = 0;
  }, []);

  return {
    messages,
    addMessage,
    clearMessages,
  };
};
