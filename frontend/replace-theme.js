import fs from 'fs';
import path from 'path';

const TARGET_DIR = path.join(process.cwd(), 'src');

const replacements = [
  { regex: /text-white/g, replace: 'text-foreground' },
  { regex: /text-gray-200/g, replace: 'text-foreground' },
  { regex: /text-gray-300/g, replace: 'text-muted-foreground' },
  { regex: /text-gray-400/g, replace: 'text-muted-foreground' },
  { regex: /text-gray-500/g, replace: 'text-muted-foreground' },
  { regex: /bg-\[#0a0a0b\]/g, replace: 'bg-background' },
  { regex: /bg-\[#13131A\]/g, replace: 'bg-card' },
  { regex: /bg-gray-800/g, replace: 'bg-muted' },
  { regex: /bg-gray-900/g, replace: 'bg-muted' },
  { regex: /border-border\/50/g, replace: 'border-border' },
  { regex: /border-white\/10/g, replace: 'border-border hover:border-primary/50' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      for (const { regex, replace } of replacements) {
        content = content.replace(regex, replace);
      }
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(TARGET_DIR);
console.log('Theme replacement complete.');
