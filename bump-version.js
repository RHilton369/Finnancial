import fs from 'fs';
import path from 'path';

const paths = [
  './finnancial-api/package.json',
  './finnancial-web/package.json'
];

function incrementVersion() {
  console.log('--- INCREMENTANDO VERSÃO DO SISTEMA ---');
  
  paths.forEach(p => {
    const fullPath = path.resolve(p);
    if (!fs.existsSync(fullPath)) return;

    const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const versionParts = pkg.version.split('.').map(Number);
    
    // Incrementa o último dígito (patch)
    versionParts[2] += 1;
    const newVersion = versionParts.join('.');
    
    pkg.version = newVersion;
    fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`[OK] ${p} -> v${newVersion}`);
  });
}

incrementVersion();
