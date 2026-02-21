/**
 * Sanitize user-provided text before interpolating into AI prompts.
 * Removes control characters and potential injection patterns.
 */
export function sanitizeForPrompt(text: string): string {
  return text
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[<>{}]/g, '')           // Remove potential injection chars
    .trim();
}
