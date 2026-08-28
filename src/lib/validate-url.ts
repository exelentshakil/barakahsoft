export function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') return false;
  const lower = url.toLowerCase().trim();
  
  // Basic spam checks
  if (lower.includes('example.com')) return false;
  if (lower.includes('test.com')) return false;
  
  // A standard URL/domain should have at least one dot (domain extension)
  if (!lower.includes('.')) return false;
  
  // It shouldn't have spaces (unless it's just badly typed, but typical domains don't)
  if (lower.includes(' ')) return false;
  
  return true;
}
