"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { apply } = require("./apply.cjs");
try {
    const filename = path.resolve(__dirname, "../../package.json");
    const raw = fs.readFileSync(filename, "utf8");
    const pkg = JSON.parse(raw);
    if (pkg.version !== "64.0.82" || !pkg.scripts?.generate?.includes("x3-dev generate")) {
        throw new Error("Run this installer in the Sage Developer Studio 64.0.82 root");
    }
    apply();
    const command = "node tools/sra-enums/apply.cjs";
    for (const name of ["postinstall", "pregenerate"]) {
        const existing = pkg.scripts[name];
        if (existing?.includes(command)) continue;
        pkg.scripts[name] = existing ? `${existing} && ${command}` : command;
    }
    const output = JSON.stringify(pkg, null, 2) + "\n";
    if (raw !== output) {
        if (!fs.existsSync(filename + ".before-sra-enums")) fs.copyFileSync(filename, filename + ".before-sra-enums");
        fs.writeFileSync(filename, output);
    }
    console.log("SRA enums: automatic reapplication enabled after npm ci and before npm run generate.");
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
