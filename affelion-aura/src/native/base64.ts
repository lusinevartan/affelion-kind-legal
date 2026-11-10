const LOOKUP = new Uint8Array(256);
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
for (let i = 0; i < CHARS.length; i++) LOOKUP[CHARS.charCodeAt(i)] = i;

/** Decode standard base64 into bytes. Hand-rolled so it is fast and dependency-free on Hermes. */
export function base64ToBytes(b64: string): Uint8Array {
  let len = b64.length;
  while (len > 0 && b64.charCodeAt(len - 1) === 61) len--; // '='
  const outLen = Math.floor((len * 3) / 4);
  const out = new Uint8Array(outLen);
  let o = 0;
  let i = 0;
  for (; i + 4 <= len; i += 4) {
    const a = LOOKUP[b64.charCodeAt(i)]!;
    const b = LOOKUP[b64.charCodeAt(i + 1)]!;
    const c = LOOKUP[b64.charCodeAt(i + 2)]!;
    const d = LOOKUP[b64.charCodeAt(i + 3)]!;
    out[o++] = (a << 2) | (b >> 4);
    out[o++] = ((b & 15) << 4) | (c >> 2);
    out[o++] = ((c & 3) << 6) | d;
  }
  const rem = len - i;
  if (rem >= 2) {
    const a = LOOKUP[b64.charCodeAt(i)]!;
    const b = LOOKUP[b64.charCodeAt(i + 1)]!;
    out[o++] = (a << 2) | (b >> 4);
    if (rem === 3) {
      const c = LOOKUP[b64.charCodeAt(i + 2)]!;
      out[o++] = ((b & 15) << 4) | (c >> 2);
    }
  }
  return o === outLen ? out : out.subarray(0, o);
}
