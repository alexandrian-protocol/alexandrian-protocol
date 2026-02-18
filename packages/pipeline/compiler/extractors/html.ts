export function extractHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ");
}
