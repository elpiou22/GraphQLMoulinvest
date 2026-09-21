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
const systemUtilsImport =
    "import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';";
const specificPackageImport =
    "import * as adminAdminSpecifiquesSra from '..';";
const transactionProperty = `    @decorators.stringProperty<PurchaseReceiptExtension, '_x3Transaction'>({
        isPublished: true,
        isTransientInput: true,
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    })
    readonly _x3Transaction: Promise<string>;
`;

function writeIfChanged(filename, contents) {
    if (fs.existsSync(filename) && fs.readFileSync(filename, "utf8") === contents) {
        return;
    }
    fs.writeFileSync(filename, contents);
}

function addImport(contents, importLine, lineBreak) {
    if (contents.includes(importLine)) return contents;

    const importMatches = [...contents.matchAll(/^import .*;$/gm)];
    if (importMatches.length === 0) {
        return `${importLine}${lineBreak}${contents}`;
    }

    const lastImport = importMatches.at(-1);
    const insertAt = lastImport.index + lastImport[0].length;
    return `${contents.slice(0, insertAt)}${lineBreak}${importLine}${contents.slice(insertAt)}`;
}

function installTransactionProperty(contents) {
    if (contents.includes("readonly _x3Transaction:")) return contents;

    const lineBreak = contents.includes("\r\n") ? "\r\n" : "\n";
    let updated = addImport(contents, systemUtilsImport, lineBreak);
    updated = addImport(updated, specificPackageImport, lineBreak);

    const classPattern =
        /(export class PurchaseReceiptExtension extends NodeExtension<[^>]+> \{)(\r?\n)/;

    if (!classPattern.test(updated)) {
        throw new Error(
            "PurchaseReceiptExtension class not found; _x3Transaction was not installed.",
        );
    }

    const property = transactionProperty.replaceAll("\n", lineBreak);
    return updated.replace(classPattern, `$1$2${property}`);
}

function apply() {
    if (fs.existsSync(target)) {
        const generatedExtension = fs.readFileSync(target, "utf8");
        writeIfChanged(target, installTransactionProperty(generatedExtension));
    } else {
        writeIfChanged(target, fs.readFileSync(source, "utf8"));
    }

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
    console.log(
        "SRA purchase receipt _x3Transaction input merged and export ordered.",
    );
}

if (require.main === module) {
    try {
        apply();
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}

module.exports = { apply, installTransactionProperty };
