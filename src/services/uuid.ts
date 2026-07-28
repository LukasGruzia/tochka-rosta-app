export function createStableUuid(now = Date.now, random = Math.random) {
  const seed = `${now().toString(16).padStart(12, '0')}${Math.floor(random() * Number.MAX_SAFE_INTEGER).toString(16).padStart(14, '0')}`.slice(-26);
  return `${seed.slice(0, 8)}-${seed.slice(8, 12)}-4${seed.slice(12, 15)}-a${seed.slice(15, 18)}-${seed.slice(18).padEnd(12, '0')}`;
}

export function isStableUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
