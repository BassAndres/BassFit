/**
 * Weight unit handling. The domain is metric-first: everything is stored in
 * kilograms and only converted at the view layer based on the user's setting.
 */
export type WeightUnit = 'kg' | 'lb';

const LB_PER_KG = 2.2046226218;

/** Convert a kg value to the user's display unit (rounded sensibly). */
export function toDisplayWeight(kg: number, unit: WeightUnit): number {
  if (unit === 'lb') return Math.round(kg * LB_PER_KG * 10) / 10;
  return Math.round(kg * 4) / 4; // nearest 0.25 kg
}

/** Convert a value typed in the display unit back to kg for storage. */
export function fromDisplayWeight(value: number, unit: WeightUnit): number {
  if (unit === 'lb') return Math.round((value / LB_PER_KG) * 100) / 100;
  return Math.round(value * 100) / 100;
}

export function unitLabel(unit: WeightUnit): string {
  return unit === 'lb' ? 'lb' : 'kg';
}

/** "60 kg" / "135 lb" formatted from a stored kg value. */
export function formatWeight(kg: number, unit: WeightUnit): string {
  const v = toDisplayWeight(kg, unit);
  // Drop trailing ".0".
  const text = Number.isInteger(v) ? String(v) : String(v);
  return `${text} ${unitLabel(unit)}`;
}
