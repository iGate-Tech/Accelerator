export function normalizeLLMResponse(raw) {
  if (!raw) return '';

  let text = String(raw).trim();

  // Remove markdown code fences if present
  const fenceMatch = text.match(/^```[a-zA-Z0-9_+-]*\n([\s\S]*?)\n?```$/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  } else {
    // Remove leading/trailing code fences separately
    if (text.startsWith('```')) {
      const afterTicks = text.slice(3);
      const firstNewline = afterTicks.indexOf('\n');
      if (firstNewline !== -1) {
        text = afterTicks.slice(firstNewline + 1);
      } else {
        text = afterTicks;
      }
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }
  }

  return text.trim();
}
