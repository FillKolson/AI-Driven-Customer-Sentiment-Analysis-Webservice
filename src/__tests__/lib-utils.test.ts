import { cn } from '../lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });
  it('handles conditional classes', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });
  it('merges tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4'); // tailwind-merge keeps last
  });
}); 