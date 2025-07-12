import { useCallback } from "react";
import { Message } from "@/lib/setup-model";

export const useCameraPermissions = () => {
  const checkCameraPermissions = useCallback(
    async (
      addMessage: (message: Omit<Message, "id" | "timestamp">) => void
    ) => {
      try {
        if ("permissions" in navigator) {
          const permission = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          if (permission.state === "denied") {
            addMessage({
              type: "error",
              content:
                "Camera access is denied. Please enable camera permissions in your browser settings.",
            });
          }
        }
      } catch (error) {
        console.log("Could not check camera permissions:", error);
      }
    },
    []
  );

  return {
    checkCameraPermissions,
  };
};
