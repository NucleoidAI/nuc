import fs from "fs";
import zlib from "zlib";

// Minimal ZIP (deflate) writer, so audio attachments can be bundled without
// pulling in an archiving dependency.

const LOCAL_HEADER_SIG = 0x04034b50;
const CENTRAL_HEADER_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;
const DEFLATE = 8;
const VERSION = 20;

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function dosDateTime(date: Date): { time: number; date: number } {
  return {
    time:
      (Math.floor(date.getSeconds() / 2) & 0x1f) |
      ((date.getMinutes() & 0x3f) << 5) |
      ((date.getHours() & 0x1f) << 11),
    date:
      (date.getDate() & 0x1f) |
      (((date.getMonth() + 1) & 0x0f) << 5) |
      ((Math.max(date.getFullYear() - 1980, 0) & 0x7f) << 9),
  };
}

function deflate(buffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zlib.deflateRaw(buffer, (err, result) =>
      err ? reject(err) : resolve(result),
    );
  });
}

type ZipEntry = { name: string; path: string };

/**
 * Writes the given files into a zip archive at outputPath.
 * Files are compressed one at a time, so peak memory stays at roughly the size
 * of the largest single entry.
 */
export async function createZip(
  entries: ZipEntry[],
  outputPath: string,
): Promise<{ path: string; bytes: number; entries: string[] }> {
  const output = fs.createWriteStream(outputPath);
  const written: Promise<void>[] = [];

  const write = (chunk: Buffer) =>
    written.push(
      new Promise<void>((resolve, reject) =>
        output.write(chunk, (err) => (err ? reject(err) : resolve())),
      ),
    );

  const central: Buffer[] = [];
  const names: string[] = [];
  let offset = 0;

  for (const entry of entries) {
    const content = await fs.promises.readFile(entry.path);
    const compressed = await deflate(content);
    const crc = crc32(content);
    const name = Buffer.from(entry.name, "utf8");
    const { time, date } = dosDateTime(new Date());

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(LOCAL_HEADER_SIG, 0);
    localHeader.writeUInt16LE(VERSION, 4);
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(DEFLATE, 8);
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(date, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra length

    write(localHeader);
    write(name);
    write(compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(CENTRAL_HEADER_SIG, 0);
    centralHeader.writeUInt16LE(VERSION, 4); // version made by
    centralHeader.writeUInt16LE(VERSION, 6); // version needed
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(DEFLATE, 10);
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(date, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra length
    centralHeader.writeUInt16LE(0, 32); // comment length
    centralHeader.writeUInt16LE(0, 34); // disk number start
    centralHeader.writeUInt16LE(0, 36); // internal attributes
    centralHeader.writeUInt32LE(0, 38); // external attributes
    centralHeader.writeUInt32LE(offset, 42);

    central.push(centralHeader, name);
    names.push(entry.name);
    offset += localHeader.length + name.length + compressed.length;
  }

  const centralSize = central.reduce((sum, buf) => sum + buf.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(EOCD_SIG, 0);
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // central directory start disk
  eocd.writeUInt16LE(names.length, 8);
  eocd.writeUInt16LE(names.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20); // comment length

  central.forEach(write);
  write(eocd);

  await Promise.all(written);
  await new Promise<void>((resolve, reject) => {
    output.on("error", reject);
    output.end(resolve);
  });

  return {
    path: outputPath,
    bytes: offset + centralSize + eocd.length,
    entries: names,
  };
}
