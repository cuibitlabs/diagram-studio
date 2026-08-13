/**
 * Minimal ZIP writer.
 *
 * Office formats are ZIP containers. Pulling in a compression library for that
 * would add a dependency to a project that otherwise has none, so this writes
 * stored (uncompressed) entries — a few hundred kilobytes for a slide, which is
 * a fair trade for zero supply chain.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let value = i;
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[i] = value >>> 0;
  }
  return table;
})();

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const encoder = new TextEncoder();

function concat(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

const u16 = (value) => new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
const u32 = (value) => new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]);

/**
 * @param {Array<{name: string, data: string|Uint8Array}>} entries
 * @returns {Uint8Array} the archive
 */
export function zip(entries) {
  const local = [];
  const central = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = typeof entry.data === "string" ? encoder.encode(entry.data) : entry.data;
    const checksum = crc32(data);

    // Fixed timestamp: the archive is a build artefact, and a moving timestamp
    // would make two identical exports differ.
    const header = concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0x21),
      u32(checksum), u32(data.length), u32(data.length), u16(name.length), u16(0),
      name, data,
    ]);
    local.push(header);

    central.push(concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0x21),
      u32(checksum), u32(data.length), u32(data.length),
      u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset),
      name,
    ]));

    offset += header.length;
  }

  const directory = concat(central);
  const end = concat([
    u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length),
    u32(directory.length), u32(offset), u16(0),
  ]);

  return concat([...local, directory, end]);
}
