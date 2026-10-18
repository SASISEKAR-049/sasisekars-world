/* Injects the server-rendered app into dist/index.html, so all content is
   readable without JavaScript and the client hydrates instead of rendering. */
import { readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const htmlPath = `${root}dist/index.html`;
const { render } = await import(pathToFileURL(`${root}dist-ssr/entry-server.js`).href);

const html = await readFile(htmlPath, 'utf8');
if (!html.includes('<!--app-html-->')) throw new Error('dist/index.html has no <!--app-html--> placeholder');
await writeFile(htmlPath, html.replace('<!--app-html-->', render()));
await rm(`${root}dist-ssr`, { recursive: true, force: true });
console.log('Pre-rendered dist/index.html');
