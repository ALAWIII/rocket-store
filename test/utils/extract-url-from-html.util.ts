export function extractUrlsFromHtml(html: string): string[] {
  const matches = [...html.matchAll(/href=["']([^"']+)["']/gi)];
  return matches.map((m) => m[1]);
}
