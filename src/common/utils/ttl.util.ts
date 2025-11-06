/**
 * Parse TTL (Time To Live) value from string
 * 
 * @param v - TTL string value (e.g., '30m', '1h', '7d', '3600')
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed TTL value or fallback
 */
export function parseTtl(v: string | undefined, fallback: number | string) {
  if (!v) return fallback;
  const s = v.trim();
  if (/^\d+[smhd]$/.test(s)) return s;
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return fallback;
}
