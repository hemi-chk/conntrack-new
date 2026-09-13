import { useCallback } from "react";

// A simple hook to mock the shadcn useToast behavior
// In a real app, this would be connected to a Toaster component
export function useToast() {
  // useCallback with an empty dep array keeps `toast` referentially stable
  // across renders - without it, any effect that lists `toast` in its
  // dependency array re-runs on every render (new function = "changed" dep),
  // which becomes a genuine infinite loop for any effect that also updates
  // state, since that state update itself triggers the next re-render.
  const toast = useCallback(({ title, description, variant }) => {
    console.log(`Toast: [${variant || "default"}] ${title} - ${description}`);
    // Fallback to alert if no toaster is present
    if (variant === "destructive") {
      alert(`Error: ${title}\n${description}`);
    } else {
      // For success/info, maybe just a console log or a simpler notification
      console.info(`${title}: ${description}`);
    }
  }, []);

  return { toast };
}
