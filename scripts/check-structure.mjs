import { stat, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const directories = [
  'frontend/src/assets', 'frontend/src/components', 'frontend/src/layouts',
  'frontend/src/pages', 'frontend/src/routes', 'frontend/src/contexts',
  'frontend/src/hooks', 'frontend/src/services', 'frontend/src/types',
  'frontend/src/utils', 'backend/src/controllers', 'backend/src/routes',
  'backend/src/services', 'backend/src/middleware', 'backend/src/validators',
  'backend/src/config', 'backend/prisma', 'docs',
];
const files = [
  'package.json', '.gitignore', 'README.md', 'docs/ARCHITECTURE.md',
  'docs/DATABASE.md', 'docs/API_DOCUMENTATION.md', 'docs/TEST_CASES.md',
  'docs/VIBE_CODING_LOG.md', 'docs/DEFENSE_QA.md',
];
let failures = 0;
for (const [paths, directory] of [[directories, true], [files, false]]) {
  for (const path of paths) {
    try {
      const metadata = await stat(new URL(path, root));
      if (directory ? !metadata.isDirectory() : !metadata.isFile()) {
        throw new Error('Sai loại đường dẫn');
      }
      if (!directory && !(await readFile(new URL(path, root), 'utf8')).trim()) {
        throw new Error('File rỗng');
      }
      console.log(`PASS ${path}`);
    } catch (error) {
      failures++;
      console.error(`FAIL ${path}: ${error.message}`);
    }
  }
}
console.log(`Checked ${directories.length + files.length} paths; failures: ${failures}`);
process.exitCode = failures ? 1 : 0;