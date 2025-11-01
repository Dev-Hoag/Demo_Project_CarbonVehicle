// src/common/utils/ttl.util.ts
export function parseTtl(v: string | undefined, fallback: number | string) {
  if (!v) return fallback;
  const s = v.trim();
  if (/^\d+[smhd]$/.test(s)) return s;      // '30m','1h','7d','3600s'
  if (/^\d+$/.test(s)) return parseInt(s,10); // '3600' -> 3600
  return fallback;
}
