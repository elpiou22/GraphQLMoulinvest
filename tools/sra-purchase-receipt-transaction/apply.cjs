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
    const anchor = "export * from './purchase-receipt-line-extension';";
    const lineBreak = originalIndex.includes("\r\n") ? "\r\n" : "\n";
    const indexLines = originalIndex
        .split(/\r?\n/)
        .filter((line) => line !== exportLine);
    const anchorIndex = indexLines.indexOf(anchor);

    if (anchorIndex >= 0) {
        indexLines.splice(anchorIndex, 0, exportLine);
    } else {
        const trailingEmptyLine = indexLines.at(-1) === "";
        if (trailingEmptyLine) indexLines.pop();
        indexLines.push(exportLine);
        if (trailingEmptyLine) indexLines.push("");
    }

    const updatedIndex = indexLines.join(lineBreak);

    writeIfChanged(index, updatedIndex);
    console.log("SRA purchase receipt _x3Transaction input installed and ordered.");
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
