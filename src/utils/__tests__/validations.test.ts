import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  isNameDuplicate,
  isValidTimeRange,
  rangesOverlap,
  validateName,
  validateAdminId
} from '../validations';

describe('validations utils', () => {
  it('normalizeText removes accents, punctuation and lowercases', () => {
    expect(normalizeText('María. López')).toBe('maria lopez');
    expect(normalizeText('  ÁÉÍÓÚ  ')).toBe('aeiou');
  });

  it('isNameDuplicate detects duplicates ignoring accents and case', () => {
    const existing = [
      { id: 'a1', nombre: 'María' },
      { id: 'b2', nombre: 'Pedro' }
    ];
    expect(isNameDuplicate('maria', existing)).toBe(true);
    expect(isNameDuplicate('MARIA', existing)).toBe(true);
    expect(isNameDuplicate('María', existing, 'a1')).toBe(false); // excluding current id
    expect(isNameDuplicate('Luis', existing)).toBe(false);
  });

  it('isValidTimeRange validates format and order', () => {
    expect(isValidTimeRange('09:00 - 10:00')).toBe(true);
    expect(isValidTimeRange('9:00-10:00')).toBe(true);
    expect(isValidTimeRange('10:00 - 09:00')).toBe(false);
    expect(isValidTimeRange('invalid')).toBe(false);
  });

  it('rangesOverlap detects overlapping and non-overlapping ranges', () => {
    expect(rangesOverlap('09:00 - 10:00', '09:30 - 09:45')).toBe(true);
    expect(rangesOverlap('09:00 - 10:00', '10:00 - 11:00')).toBe(false);
    expect(rangesOverlap('08:00 - 09:00', '09:00 - 10:00')).toBe(false);
    expect(rangesOverlap('08:00 - 12:00', '09:00 - 11:00')).toBe(true);
    expect(rangesOverlap('bad', '09:00 - 10:00')).toBe(false);
  });

  it('validateName enforces min/max lengths', () => {
    expect(validateName('A')).toBe(true);
    expect(validateName('')).toBe(false);
    expect(validateName('a'.repeat(81))).toBe(false);
  });

  it('validateAdminId allows basic id formats', () => {
    expect(validateAdminId('admin-1')).toBe(true);
    expect(validateAdminId('ab')).toBe(false);
    expect(validateAdminId('this_is_a_very_long_admin_identifier_exceeding_limit')).toBe(false);
    expect(validateAdminId('ok_id_123')).toBe(true);
  });
});
