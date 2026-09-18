"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { patchGenerator } = require("./apply.cjs");
try {
    const root = path.resolve(__dirname, "../..");
    const filename = path.join(root, "package.json");
    const pkg = JSON.parse(fs.readFileSync(filename, "utf8"));
    const command = "node tools/sra-enums/apply.cjs";
    for (const key of ["postinstall", "pregenerate"]) {
        const value = pkg.scripts?.[key];
        if (value === command) delete pkg.scripts[key];
        else if (value?.endsWith(" && " + command)) pkg.scripts[key] = value.slice(0, -(" && " + command).length);
        else if (value?.includes(command)) throw new Error(`Hook ${key} was rearranged; remove only the SRA enums command manually`);
    }
    const file = path.join(root, "node_modules/@sage/xtrem-x3-dictionary/build/lib/functions/x3-node-class-generator.js");
    const original = fs.readFileSync(path.join(__dirname, "reference/x3-node-class-generator.js"), "utf8");
    const normalize = text => text.replace(/\r\n/g, "\n");
    if (fs.existsSync(file)) {
        const current = fs.readFileSync(file, "utf8");
        if (![normalize(original), normalize(patchGenerator(original))].includes(normalize(current))) throw new Error("Generator has other changes; refusing to overwrite it");
        fs.writeFileSync(file, original);
    }
    fs.writeFileSync(filename, JSON.stringify(pkg, null, 2) + "\n");
    console.log("SRA enums disabled. Native ENG helper retained. No other helper modified.");
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
