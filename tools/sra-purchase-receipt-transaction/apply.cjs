"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const extensions = path.join(
    root,
    "shared/admin-specifiques-sra/lib/node-extensions",
);
const source = path.join(__dirname, "purchase-receipt-extension.ts");
const target = path.join(extensions, "purchase-receipt-extension.ts");
const index = path.join(extensions, "index.ts");
const exportLine = "export * from './purchase-receipt-extension';";

function writeIfChanged(filename, contents) {
    if (fs.existsSync(filename) && fs.readFileSync(filename, "utf8") === contents) {
        return;
    }
    fs.writeFileSync(filename, contents);
}

function apply() {
    writeIfChanged(target, fs.readFileSync(source, "utf8"));

    const originalIndex = fs.readFileSync(index, "utf8");
    if (originalIndex.includes(exportLine)) {
        console.log("SRA purchase receipt transaction input already installed.");
        return;
    }

    const anchor = "export * from './purchase-receipt-line-extension';";
    const updatedIndex = originalIndex.includes(anchor)
        ? originalIndex.replace(anchor, `${anchor}\n${exportLine}`)
        : `${originalIndex.trimEnd()}\n${exportLine}\n`;

    writeIfChanged(index, updatedIndex);
    console.log("SRA purchase receipt _x3Transaction input installed.");
}

if (require.main === module) {
    try {
        apply();
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}

module.exports = { apply };
