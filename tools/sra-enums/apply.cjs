"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "../..");
const dictionary = path.join(root, "node_modules/@sage/xtrem-x3-dictionary");
const normalize = text => text.replace(/\r\n/g, "\n");
const read = file => fs.readFileSync(file, "utf8");
const hash = text => crypto.createHash("sha256").update(normalize(text)).digest("hex");

function patchGenerator(source) {
    const statement = /const localMenuDefinition = await x3_local_menu_dictionary_helper_1\.X3LocalMenuDictionaryHelper\.getLocalMenuDefinition\(this\.connPool, this\.x3FolderName, (nodeClassPropObject|property)\.localMenuNumber, this\.packageGenerator\.metadata\);\r?\n(\s*)const enumGenerator = new x3_enum_generator_1\.X3EnumGenerator\(this\.packageGenerator, localMenuDefinition\);/g;
    let count = 0;
    const result = source.replace(statement, (_, prop, indent) => {
        count++;
        return `const standardEnum = await require("./resolve-standard-enum").resolveStandardEnum(this, ${prop});\n${indent}const enumGenerator = standardEnum ?? new x3_enum_generator_1.X3EnumGenerator(this.packageGenerator, await x3_local_menu_dictionary_helper_1.X3LocalMenuDictionaryHelper.getLocalMenuDefinition(this.connPool, this.x3FolderName, ${prop}.localMenuNumber, this.packageGenerator.metadata));`;
    });
    if (count !== 4) throw new Error(`Expected four enum resolution sites, found ${count}`);
    return result;
}

function apply() {
    const manifest = JSON.parse(read(path.join(dictionary, "package.json")));
    if (manifest.version !== "64.0.82") throw new Error("Only xtrem-x3-dictionary 64.0.82 is supported");
    const directory = path.join(dictionary, "build/lib/functions");
    const generatorFile = path.join(directory, "x3-node-class-generator.js");
    const helperFile = path.join(directory, "x3-local-menu-dictionary-helper.js");
    const original = read(path.join(__dirname, "reference/x3-node-class-generator.js"));
    const patched = patchGenerator(original);
    const current = read(generatorFile);
    if (![hash(original), hash(patched)].includes(hash(current))) {
        throw new Error("Node generator has other modifications; refusing to overwrite it");
    }
    const originalHelper = read(path.join(__dirname, "reference/x3-local-menu-dictionary-helper.js"));
    const currentHelper = read(helperFile);
    if (hash(currentHelper) !== hash(originalHelper) && hash(currentHelper.replace(/'FRA'/g, "'ENG'")) !== hash(originalHelper)) {
        throw new Error("Menu helper has changes other than ENG -> FRA; refusing to overwrite it");
    }
    // Verify the actual enum artifacts before changing any installed file.
    const definitions = JSON.parse(read(path.join(__dirname, "standard-enums.json")));
    for (const info of Object.values(definitions)) {
        const pkg = path.join(root, "node_modules", info.rootPackageName);
        if (JSON.parse(read(path.join(pkg, "package.json"))).version !== "64.0.82") throw new Error(`Unexpected version: ${info.rootPackageName}`);
        for (const extension of ["js", "d.ts"]) {
            const filename = `${info.filename}.${extension}`;
            if (hash(read(path.join(pkg, "build/lib/enums", filename))) !== hash(read(path.join(__dirname, "reference", filename)))) {
                throw new Error(`Standard enum differs from Sage archive: ${filename}`);
            }
        }
    }
    const write = (target, contents) => {
        if (fs.existsSync(target) && read(target) === contents) return;
        const backup = target + ".before-sra-enums";
        if (fs.existsSync(target) && !fs.existsSync(backup)) fs.copyFileSync(target, backup);
        fs.writeFileSync(target, contents);
    };
    write(helperFile, originalHelper);
    write(generatorFile, patched);
    write(path.join(directory, "resolve-standard-enum.js"), read(path.join(__dirname, "resolve-standard-enum.js")));
    write(path.join(directory, "sra-standard-enums.json"), read(path.join(__dirname, "standard-enums.json")));
    console.log("SRA enums: targeted generator patch installed; native ENG SQL restored.");
}

if (require.main === module) {
    try { apply(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { apply, patchGenerator };
