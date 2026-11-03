import { describe, expect, it } from 'vitest';
import { meetingCode } from '../src/shared/meet.ts';

describe('meetingCode', () => {
  it.each([
    ['/abc-defg-hij', 'abc-defg-hij'],
    ['/meet/xye-ebzc-fux', 'xye-ebzc-fux'],
    ['/_meet/ABC-DEFG-HIJ', 'abc-defg-hij'],
    ['/', null],
    ['/landing', null],
    ['/new', null],
  ])('%s', (path, code) => {
    expect(meetingCode(path)).toBe(code);
  });
});
