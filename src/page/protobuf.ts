/**
 * Just enough protobuf to read one message: field number -> raw values.
 *
 * Varints come back as numbers, length-delimited fields as byte slices that
 * can be decoded again as nested messages. Fixed-width fields are skipped,
 * since nothing here needs them. A malformed buffer ends the read early
 * rather than throwing; whatever was decoded up to that point is kept.
 */

export type FieldValue = number | Uint8Array;
export type Fields = Map<number, FieldValue[]>;

const WIRE_VARINT = 0;
const WIRE_FIXED64 = 1;
const WIRE_BYTES = 2;
const WIRE_FIXED32 = 5;

/**
 * Reads a varint at `offset`. Uses multiplication instead of bit shifts,
 * because shifts truncate to 32 bits and timestamps do not fit.
 */
export function readVarint(bytes: Uint8Array, offset: number): [value: number, next: number] | null {
  let value = 0;
  let scale = 1;
  for (let i = offset; i < bytes.length && i < offset + 10; i++) {
    const byte = bytes[i]!;
    value += (byte & 0x7f) * scale;
    scale *= 128;
    if ((byte & 0x80) === 0) return [value, i + 1];
  }
  return null;
}

export function readFields(bytes: Uint8Array): Fields {
  const fields: Fields = new Map();
  let offset = 0;

  while (offset < bytes.length) {
    const tag = readVarint(bytes, offset);
    if (!tag) break;
    const [key, afterTag] = tag;
    const field = Math.floor(key / 8);
    const wire = key % 8;
    offset = afterTag;

    let value: FieldValue;
    if (wire === WIRE_VARINT) {
      const v = readVarint(bytes, offset);
      if (!v) break;
      [value, offset] = v;
    } else if (wire === WIRE_BYTES) {
      const len = readVarint(bytes, offset);
      if (!len || len[1] + len[0] > bytes.length) break;
      value = bytes.subarray(len[1], len[1] + len[0]);
      offset = len[1] + len[0];
    } else if (wire === WIRE_FIXED64) {
      offset += 8;
      continue;
    } else if (wire === WIRE_FIXED32) {
      offset += 4;
      continue;
    } else {
      break; // groups are deprecated and never used here; treat as corrupt
    }

    const list = fields.get(field);
    if (list) list.push(value);
    else fields.set(field, [value]);
  }
  return fields;
}

export function firstMessage(fields: Fields, field: number): Fields | null {
  const value = fields.get(field)?.[0];
  return value instanceof Uint8Array ? readFields(value) : null;
}

export function firstNumber(fields: Fields, field: number): number | null {
  const value = fields.get(field)?.[0];
  return typeof value === 'number' ? value : null;
}
