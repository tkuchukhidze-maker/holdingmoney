// Imports the 9 approved Claude Design prototypes byte-for-byte from the
// client-provided ZIP. This is NOT a prototype-to-Laravel converter.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const archive = process.argv[2];
if (!archive) {
  console.error('Usage: node scripts/import-designs.mjs "/path/to/EPISODE_HOLDING_FULL_SOURCE.zip"');
  process.exit(2);
}
const root = resolve('design/project');
const hashes = {
  Main: 'abc8b6436542b722d064dfa4dd251caba58c642c94ba29141fb4f5b68af524ce',
  Batumi: 'cccd05f3d2d54106d7b3405a5f6b0df448f5ecdb0b7b99d51c1e8219239a472a',
  Kutaisi: 'c1b0eaf70a398c739a5732ab9dc9c2a4b4d2683a2693e94b9b1ec05f9a30d26d',
  Tbilisi: '4428b99d63ca05b0f321b9128006522dc32376a0c748b110569ca5463a920ca7',
  Magnolia: '02d7f5cb2256340491f8965294935a4f2e6c62611f6c92afad9df7cb93b5d99f',
  ChateauMere: 'a2f23d4b73ea146c754d87c226d89456a42dacbaeb7b7a1959332c57cc7c7d0c',
  Register: '0192245a276236812e3a64ee4ac9654a39aa9e4b4d549b1251e0ccce91896811',
  MyEpisode: '5f415309d1573dc1bd1264df24b0fbd871689b93e1b810c7781c44663a1c20bc',
  Admin: '39e845f9bf419ba16ec9c73adb64bbb7c2c30f5731c06e6dae51613d0e8d2714',
};
const prefix = 'EPISODE_HOLDING_FULL_SOURCE/design/project/';
const bytes = {};
for (const [name, expected] of Object.entries(hashes)) {
  const file = prefix + name + '.dc.html';
  const data = execFileSync('unzip', ['-p', archive, file], { maxBuffer: 3 * 1024 * 1024 });
  const actual = createHash('sha256').update(data).digest('hex');
  if (actual !== expected) throw new Error('Design source mismatch: ' + name + ' (' + actual + ')');
  bytes[name + '.dc.html'] = data;
}
const canvas = execFileSync('unzip', ['-p', archive, prefix + 'canvas.json'], { maxBuffer: 1024 * 1024 });
const parsed = JSON.parse(canvas.toString('utf8'));
if (!Array.isArray(parsed.order) || parsed.order.length !== 9) throw new Error('Canvas index is incomplete.');
mkdirSync(root, { recursive: true });
for (const [name, data] of Object.entries(bytes)) writeFileSync(join(root, name), data);
writeFileSync(join(root, 'canvas.json'), canvas);
console.log('Imported all 9 approved prototype files without modification. Not deployed.');
