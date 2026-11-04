// One-time: download the exact Google Fonts the app uses so capture and render never depend on the network.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const url = 'https://fonts.googleapis.com/css2?family=Alegreya+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300&family=Cormorant+Garamond:wght@500;600;700&display=swap';
const dir = path.resolve('public/fonts');
fs.mkdirSync(dir, { recursive: true });
const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
let css = await (await fetch(url, { headers: { 'user-agent': ua } })).text();
const files = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map((m) => m[1]);
for (const f of [...new Set(files)]) {
  const name = crypto.createHash('md5').update(f).digest('hex').slice(0, 10) + '.woff2';
  fs.writeFileSync(path.join(dir, name), Buffer.from(await (await fetch(f)).arrayBuffer()));
  css = css.split(f).join(`http://fonts.local/${name}`);
}
fs.writeFileSync(path.join(dir, 'fonts.css'), css);
console.log('fonts saved:', files.length, 'files');
