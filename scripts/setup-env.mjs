import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

for (const directory of ['frontend', 'backend']) {
  const example = new URL(`../${directory}/.env.example`, import.meta.url);
  const destination = new URL(`../${directory}/.env`, import.meta.url);
  let content = await readFile(example, 'utf8');
  if (directory === 'backend') content = content.replace('JWT_SECRET=', `JWT_SECRET=${randomBytes(48).toString('hex')}`);
  try {
    await writeFile(destination, content, { flag: 'wx' });
    console.log(`Created ${directory}/.env`);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    console.log(`Kept existing ${directory}/.env`);
  }
}