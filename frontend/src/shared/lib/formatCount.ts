/** Rút gọn số lượng kiểu Instagram: 999 → "999", 1000 → "1k", 1100 → "1.1k", 1_200_000 → "1.2tr". */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return strip(n / 1000) + 'k';
  return strip(n / 1_000_000) + 'tr';
}

function strip(x: number): string {
  const r = Math.floor(x * 10) / 10; // 1 chữ số thập phân, không làm tròn lên
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}
