const fs = require('node:fs');
const path = require('node:path');

const target = path.join(
    process.cwd(),
    'node_modules',
    '@sage',
    'x3-purchasing',
    'build',
    'lib',
    'nodes',
    'purchase-order-line.js',
);

const anchor = "        isPrinted: 'isPrinted',\n";
const addition = "        isPrinted: 'isPrinted',\n        isPefc: 'isPefc',\n        pefcValue: 'pefcValue',\n";

if (!fs.existsSync(target)) {
    throw new Error(`Fichier standard introuvable : ${target}`);
}

const source = fs.readFileSync(target, 'utf8');
if (source.includes("        pefcValue: 'pefcValue',")) {
    process.exit(0);
}

if (!source.includes(anchor)) {
    throw new Error('Point d\'insertion composite introuvable dans purchase-order-line.js.');
}

fs.writeFileSync(target, source.replace(anchor, addition), 'utf8');
