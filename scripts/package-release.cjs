// Dependency-free ZIP writer. Includes only the audited dist tree, never the repo.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const { root, dist, version, files } = require('./audit-release.cjs')();
const outputDir = path.join(root, 'releases');
fs.mkdirSync(outputDir, { recursive: true });
const output = path.join(outputDir, `delight-${version}.zip`);
if (fs.existsSync(output)) throw new Error('Release ZIP already exists. Move it aside explicitly before repackaging; it was not overwritten.');
const table = Array.from({ length: 256 }, (_, n) => { for (let bit = 0; bit < 8; bit++) n = n & 1 ? 0xedb88320 ^ n >>> 1 : n >>> 1; return n >>> 0; });
const crc32 = data => { let crc = 0xffffffff; for (const byte of data) crc = table[(crc ^ byte) & 255] ^ crc >>> 8; return (crc ^ 0xffffffff) >>> 0; };
const local = [], central = [];
let offset = 0;
for (const file of files.sort()) {
  const name = Buffer.from(path.relative(dist, file).split(path.sep).join('/'));
  const content = fs.readFileSync(file), compressed = zlib.deflateRawSync(content), crc = crc32(content);
  if (content.length >= 0xffffffff || offset >= 0xffffffff) throw new Error('ZIP64 is not supported');
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x800, 6); header.writeUInt16LE(8, 8);
  header.writeUInt16LE(33, 12); header.writeUInt32LE(crc, 14); header.writeUInt32LE(compressed.length, 18); header.writeUInt32LE(content.length, 22); header.writeUInt16LE(name.length, 26);
  local.push(header, name, compressed);
  const entry = Buffer.alloc(46);
  entry.writeUInt32LE(0x02014b50); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6); entry.writeUInt16LE(0x800, 8); entry.writeUInt16LE(8, 10);
  entry.writeUInt16LE(33, 14); entry.writeUInt32LE(crc, 16); entry.writeUInt32LE(compressed.length, 20); entry.writeUInt32LE(content.length, 24); entry.writeUInt16LE(name.length, 28); entry.writeUInt32LE(offset, 42);
  central.push(entry, name); offset += header.length + name.length + compressed.length;
}
const directory = Buffer.concat(central), end = Buffer.alloc(22);
if (files.length > 65535) throw new Error('Too many ZIP entries');
end.writeUInt32LE(0x06054b50); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
const zip = Buffer.concat([...local, directory, end]);
fs.writeFileSync(output, zip, { flag: 'wx' });
console.log(`Created ${path.relative(root, output)} (${zip.length} bytes), SHA256 ${crypto.createHash('sha256').update(zip).digest('hex')}`);
