import { randomBytes } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
const password=randomBytes(24).toString('hex'),secret=randomBytes(48).toString('hex');
let template=await readFile(new URL('../.env.example',import.meta.url),'utf8');
template=template.replace('CHANGE_ME_GENERATE_AT_LEAST_32_RANDOM_CHARACTERS',secret).replaceAll('CHANGE_ME',password);
await writeFile(new URL('../.env',import.meta.url),template,{flag:'wx',mode:0o600});
console.log('Created .env with local development credentials. Next: docker compose up -d db');
