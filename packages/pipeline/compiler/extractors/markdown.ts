export function extractMarkdown(markdown: string): string {
  return markdown.replace(/[#_*`>-]/g, " ");
}
