import fs from 'fs';
import path from 'path';

const source = path.join(process.cwd(), 'docs', '.vitepress', 'dist');
const destination = path.join(process.cwd(), 'dist', 'docs');

try {
  fs.cpSync(source, destination, { recursive: true });
  console.log('Successfully copied docs build to dist/docs');
} catch (error) {
  console.error('Error copying docs:', error);
  process.exit(1);
}
