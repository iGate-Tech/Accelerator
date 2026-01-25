export function normalizeLLMResponse(raw) {
  if (!raw) return '';

  let text = String(raw).trim();

  const fenceMatch = text.match(/^```[a-zA-Z0-9_+-]*\n([\s\S]*?)\n?```$/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  if (text.startsWith('```')) {
    const afterTicks = text.slice(3);
    const firstNewline = afterTicks.indexOf('\n');
    if (firstNewline !== -1) {
      text = afterTicks.slice(firstNewline + 1);
    } else {
      text = '';
    }
  }

  if (text.endsWith('```')) {
    text = text.slice(0, -3);
  }

  return text.trim();
}
