/**
 * Lightweight fuzzy / similarity helpers for entity duplicate detection.
 *
 * These run in the frontend using already-loaded master data. For very large
 * datasets (tens of thousands of rows) consider moving detection to the Rust
 * backend.
 */

export interface FuzzyMatchable {
  [key: string]: any;
}

/**
 * Compute Levenshtein distance between two strings.
 */
export function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Similarity score 0..1 based on Levenshtein distance.
 */
export function stringSimilarity(a: string, b: string): number {
  const left = (a || '').trim().toLowerCase();
  const right = (b || '').trim().toLowerCase();
  if (!left && !right) return 1;
  if (!left || !right) return 0;
  if (left === right) return 1;
  const distance = levenshtein(left, right);
  const maxLen = Math.max(left.length, right.length);
  return 1 - distance / maxLen;
}

/**
 * Normalize a phone number for comparison.
 * Strips non-digits and converts +62 / 62 prefixes to 0.
 */
export function normalizePhone(phone: string | undefined | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62') && digits.length > 2) {
    return '0' + digits.slice(2);
  }
  if (digits.startsWith('0')) return digits;
  return digits;
}

export interface DuplicateCheckField<T = FuzzyMatchable> {
  key: keyof T | string;
  /** Weight of this field in the total score. */
  weight: number;
  /** Use phone normalization for this field. */
  isPhone?: boolean;
  /** Threshold for a strong match on this field. */
  threshold?: number;
}

export interface DuplicateResult<T = FuzzyMatchable> {
  item: T;
  score: number;
  matchedFields: { key: string; similarity: number }[];
}

/**
 * Find the best duplicate candidate from a list of existing records.
 *
 * Example:
 *   findBestDuplicate(
 *     { name: 'Budi Utomo', wa_number: '08123456789' },
 *     penulisList,
 *     [
 *       { key: 'name', weight: 0.6, threshold: 0.85 },
 *       { key: 'wa_number', weight: 0.4, isPhone: true, threshold: 0.95 },
 *     ]
 *   )
 */
export function findBestDuplicate<T extends FuzzyMatchable>(
  candidate: FuzzyMatchable,
  existing: T[],
  fields: DuplicateCheckField<T>[],
  overallThreshold = 0.75
): DuplicateResult<T> | null {
  if (!existing.length || !fields.length) return null;

  let best: DuplicateResult<T> | null = null;

  for (const item of existing) {
    let totalWeight = 0;
    let weightedScore = 0;
    const matchedFields: { key: string; similarity: number }[] = [];
    let strongMatchCount = 0;

    for (const field of fields) {
      const key = field.key as string;
      const rawA = candidate[key];
      const rawB = item[key];

      let a = typeof rawA === 'string' ? rawA : String(rawA ?? '');
      let b = typeof rawB === 'string' ? rawB : String(rawB ?? '');

      if (field.isPhone) {
        a = normalizePhone(a);
        b = normalizePhone(b);
      }

      const similarity = stringSimilarity(a, b);
      totalWeight += field.weight;
      weightedScore += similarity * field.weight;

      if (similarity > 0) {
        matchedFields.push({ key, similarity });
      }

      const threshold = field.threshold ?? 0.9;
      if (similarity >= threshold) {
        strongMatchCount++;
      }
    }

    const score = totalWeight > 0 ? weightedScore / totalWeight : 0;
    if (score >= overallThreshold && (!best || score > best.score)) {
      best = { item, score, matchedFields };
    }
  }

  return best;
}

/**
 * Build a human-readable duplicate reason string.
 */
export function formatDuplicateReason<T extends FuzzyMatchable>(
  result: DuplicateResult<T>,
  labelField = 'name'
): string {
  const name = result.item[labelField] || 'Data yang sudah ada';
  const topFields = result.matchedFields
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 2)
    .map((f) => f.key)
    .join(' dan ');
  return `${name} memiliki kemiripan pada ${topFields}`;
}
