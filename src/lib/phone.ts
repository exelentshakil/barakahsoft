/** Normalize common North American numbers for display without changing other formats. */
export function displayPhone(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (local.length !== 10) return raw;
  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}
