import { useEffect, useCallback, type RefObject } from "react";

/**
 * Cmd+Enter (Mac) / Ctrl+Enter (Win) to submit from a textarea.
 * Also supports Escape to blur.
 */
export function useSubmitShortcut(
  ref: RefObject<HTMLTextAreaElement | null>,
  onSubmit: () => void,
  enabled = true,
) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSubmit();
      }
      if (e.key === "Escape") {
        (e.target as HTMLElement)?.blur();
      }
    },
    [onSubmit, enabled],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [ref, handler]);
}
