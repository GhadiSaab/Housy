import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const [directory = 'dist', output = '.astro/security-headers.conf'] = process.argv.slice(2);
const hashes = new Set();
function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) visit(path);
    else if (entry.name.endsWith('.html')) {
      const html = readFileSync(path, 'utf8');
      for (const [, attributes, code] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
        if (!/\bsrc\s*=/i.test(attributes) && code.trim()) {
          hashes.add(`'sha256-${createHash('sha256').update(code).digest('base64')}'`);
        }
      }
    }
  }
}
visit(directory);
const policy = [
  "default-src 'none'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'",
  `script-src 'self' ${[...hashes].sort().join(' ')}`, "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:", "font-src 'self'", "connect-src 'self'", "form-action 'none'",
].join('; ') + ';';
const headers = {
  'Content-Security-Policy': policy,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=31536000',
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, Object.entries(headers).map(([name, value]) => `add_header ${name} "${value}" always;`).join('\n') + '\n');
console.log(`Generated security headers allowing ${hashes.size} distinct inline scripts.`);
