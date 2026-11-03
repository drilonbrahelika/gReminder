import { describe, expect, it } from 'vitest';
import { responseBytes, scheduleFromResponse } from '../src/page/calendar-event.ts';
import { readFields, readVarint } from '../src/page/protobuf.ts';
import { base64, calendarResponse, varint } from './protobuf-helpers.ts';

const START = Date.UTC(2026, 9, 28, 14, 0);
const END = Date.UTC(2026, 9, 28, 14, 30);

describe('protobuf reader', () => {
  it('reads varints wider than 32 bits', () => {
    const big = 1_789_054_200_123;
    expect(readVarint(new Uint8Array(varint(big)), 0)).toEqual([big, varint(big).length]);
  });

  it('stops at a truncated length instead of throwing', () => {
    const fields = readFields(new Uint8Array([0x08, 0x01, 0x12, 0x05, 0x01]));
    expect(fields.get(1)).toEqual([1]);
    expect(fields.has(2)).toBe(false);
  });
});

describe('scheduleFromResponse', () => {
  it('reads start and end from a base64 body', () => {
    const bytes = responseBytes(base64(calendarResponse(START, END)));
    expect(scheduleFromResponse(bytes!)).toEqual({ startMs: START, endMs: END });
  });

  it('reads a raw binary body too', () => {
    const raw = calendarResponse(START, END);
    const bytes = responseBytes(raw.buffer as ArrayBuffer);
    expect(scheduleFromResponse(bytes!)).toEqual({ startMs: START, endMs: END });
  });

  it('returns null for an instant meeting with no event', () => {
    expect(scheduleFromResponse(new Uint8Array())).toBeNull();
    expect(responseBytes(new ArrayBuffer(0))).toBeNull();
  });

  it('returns null when the event has no end time', () => {
    expect(scheduleFromResponse(calendarResponse(START, null))).toBeNull();
  });

  it('keeps the end when the start is missing', () => {
    expect(scheduleFromResponse(calendarResponse(null, END))).toEqual({ startMs: null, endMs: END });
  });
});
