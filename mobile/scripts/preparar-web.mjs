// Copia o app web (../HTML/carro-facil) para www/ no formato que o Capacitor empacota.
// Diferenças em relação ao site: sem service worker/manifest e com o Supabase embutido (não depende de CDN).
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url)), raiz = join(aqui, '..'), origem = join(raiz, '..', 'HTML', 'carro-facil'), destino = join(raiz, 'www');
rmSync(destino, { recursive: true, force: true }); mkdirSync(join(destino, 'js', 'vendor'), { recursive: true });
for (const f of ['style.css', 'icon.svg']) cpSync(join(origem, f), join(destino, f));
cpSync(join(origem, 'js'), join(destino, 'js'), { recursive: true });

const umd = join(raiz, 'node_modules', '@supabase', 'supabase-js', 'dist', 'umd', 'supabase.js');
if (!existsSync(umd)) { console.error('Rode "npm install" antes (falta @supabase/supabase-js).'); process.exit(1); }
cpSync(umd, join(destino, 'js', 'vendor', 'supabase.js'));

let html = readFileSync(join(origem, 'index.html'), 'utf8');
html = html.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@[^"]+"><\/script>/, '<script src="js/vendor/supabase.js"></script>')
  .replace(/\s*<link rel="manifest"[^>]*>/, '');
if (html.includes('cdn.jsdelivr.net')) { console.error('index.html ainda aponta para o CDN do Supabase: ajuste o padrão em scripts/preparar-web.mjs'); process.exit(1); }
writeFileSync(join(destino, 'index.html'), html);

// ordem de scripts: o plugin do Capacitor injeta window.Capacitor antes destes; nativo.js depende dele
console.log('www/ pronto:', destino);
