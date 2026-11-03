/** A tiny protobuf writer, enough to build FetchCalendarEvent-shaped fixtures. */
export function varint(n: number): number[] {
  const out: number[] = [];
  while (n >= 128) {
    out.push((n % 128) | 0x80);
    n = Math.floor(n / 128);
  }
  out.push(n);
  return out;
}

export const intField = (field: number, value: number): number[] => [...varint(field * 8), ...varint(value)];

export const bytesField = (field: number, bytes: number[]): number[] => [
  ...varint(field * 8 + 2),
  ...varint(bytes.length),
  ...bytes,
];

export const stringField = (field: number, text: string): number[] =>
  bytesField(field, [...new TextEncoder().encode(text)]);

export const timestamp = (field: number, ms: number): number[] => bytesField(field, intField(1, ms / 1000));

/** A calendar-event response like the one Meet receives, as raw protobuf. */
export function calendarResponse(startMs: number | null, endMs: number | null): Uint8Array {
  const event = [
    ...stringField(5, 'Weekly sync'),
    ...(startMs === null ? [] : timestamp(10, startMs)),
    ...(endMs === null ? [] : timestamp(11, endMs)),
    ...stringField(17, 'https://meet.google.com/abc-defg-hij'),
  ];
  return new Uint8Array(bytesField(1, event));
}

export function base64(bytes: Uint8Array): ArrayBuffer {
  const text = btoa(String.fromCharCode(...bytes));
  return new TextEncoder().encode(text).buffer as ArrayBuffer;
}
