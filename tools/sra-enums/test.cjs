"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const os = require("node:os");
const { spawnSync } = require("node:child_process");
const { patchGenerator } = require("./apply.cjs");
const standards = require("./standard-enums.json");
const source = fs.readFileSync(path.join(__dirname, "resolve-standard-enum.js"), "utf8");

function setup(options = {}) {
    const logs = [];
    let calls = 0;
    const exported = {};
    const menus = {
        getLocalMenuValues: async () => { calls++; return options.english || []; },
        getLocalMenuValueOverrideDbData: async () => options.overrides || [],
    };
    vm.runInNewContext(source, {
        exports: exported,
        console: { warn: text => logs.push(text) },
        require: name => {
            if (name === "./x3-local-menu-dictionary-helper") return { X3LocalMenuDictionaryHelper: menus };
            if (name === "./x3-dictionary-helper") return { X3DictionaryHelper: { fromSql: (type, value) => type === "integer" ? Number(value) : value ?? "" } };
            if (name === "./sra-standard-enums.json") return standards;
            throw Error(name);
        },
    });
    const generator = {
        packageGenerator: { metadata: { name: options.package || "@admin/admin-specifiques-sra" } },
        x3FolderName: options.folder || "DEV",
        connPool: {
            withConnection: fn => fn({}),
            createReader: (_, query) => ({ readAll: async () => {
                if (query.includes("AMENLOC aml")) return options.headers || [{ MENLOCAL_0: 2, CODACT_0: "", AENUMNAM_0: "", APACK_0: "" }];
                assert.match(query, /SELECT DISTINCT LANNUM_0/);
                const n = Number(query.match(/LANCHP_0 = (\d+)/)[1]);
                return options.values || Object.keys(standards[n].values).map(v => ({ LANNUM_0: Number(v) }));
            } }),
        },
    };
    return { run: (property = { nodeName: "YmiscellaneousReceipt", name: "entryType", localMenuNumber: 701 }) => exported.resolveStandardEnum(generator, property), logs, calls: () => calls };
}

for (const [nodeName, name, number] of [
    ["Coupe", "rateType", 202],
    ["YmiscellaneousReceipt", "entryType", 701],
    ["YmiscellaneousReceipt", "sourceDocumentType", 701],
    ["YmiscellaneousReceiptLine", "entryType", 701],
    ["YmiscellaneousReceiptLine", "sourceDocumentType", 701],
    ["YmiscellaneousReceiptLine", "priceType", 220],
    ["YmiscellaneousReceiptLine", "lineType", 2731],
    ["YmiscellaneousReceiptLine", "bomType", 224],
    ["YmiscellaneousReceiptDimensions", "entryType", 701],
]) {
    test(`${nodeName}.${name}: shipped enum ${number}`, async () => {
        const s = setup();
        const result = await s.run({ nodeName, name, localMenuNumber: number });
        assert.equal(result.rootName, standards[number].rootName);
        assert.equal(result.rootPackageName, standards[number].rootPackageName);
        assert.equal(result.rootDataTypeName, standards[number].rootDataTypeName);
        assert.equal(s.logs.length, 1);
    });
}

test("English available: use native resolver", async () => assert.equal(await setup({ english: [{ valueNumber: 19 }] }).run(), undefined));
test("Other package unchanged", async () => { const s = setup({ package: "@sage/x3-stock-data" }); assert.equal(await s.run(), undefined); assert.equal(s.calls(), 0); });
test("Other node unchanged", async () => assert.equal(await setup().run({ nodeName: "Supplier", name: "entryType", localMenuNumber: 701 }), undefined));
test("Unlisted property/menu unchanged", async () => assert.equal(await setup().run({ nodeName: "Coupe", name: "rateType", localMenuNumber: 6000 }), undefined));
test("Existing compatible 701 exception", async () => {
    const s = setup({ headers: [{ MENLOCAL_0: 2, AENUMNAM_0: "entryType", APACK_0: "@sage/x3-stock-data" }], overrides: [{ AMENLOC_0: 701, LANNUM_0: 19, AENUMVAL_0: "miscellaneousReceipt" }] });
    assert.equal((await s.run()).rootName, "EntryTypeEnum");
});
for (const [description, options, error] of [
    ["missing menu", { headers: [] }, /missing\/invalid/],
    ["non-menu", { headers: [{ MENLOCAL_0: 1 }] }, /missing\/invalid/],
    ["custom activity", { headers: [{ MENLOCAL_0: 2, CODACT_0: "YSRA" }] }, /custom activity/],
    ["wrong owner", { headers: [{ MENLOCAL_0: 2, APACK_0: "@admin/other" }] }, /package exception/],
    ["wrong name", { headers: [{ MENLOCAL_0: 2, AENUMNAM_0: "Other" }] }, /name exception/],
    ["no values", { values: [] }, /no local values/],
    ["unknown value", { values: [{ LANNUM_0: 99 }] }, /unknown local numeric/],
    ["renamed value", { overrides: [{ AMENLOC_0: 701, LANNUM_0: 19, AENUMVAL_0: "different" }] }, /value exception/],
    ["extended enum", { overrides: [{ AMENLOC_0: 701, LANNUM_0: 19, APACKVAL_0: "@admin/extension" }] }, /enum extension/],
    ["unsafe identifier", { folder: "DEV;DELETE" }, /folder identifier/],
]) test(`Refuses ${description}`, async () => assert.rejects(setup(options).run(), error));
test("Cache is scoped to generator instance", async () => { const s = setup(); await s.run(); await s.run(); assert.equal(s.calls(), 1); });
test("All four native resolution sites are replaced and syntax remains valid", () => {
    const original = fs.readFileSync(path.join(__dirname, "reference/x3-node-class-generator.js"), "utf8");
    const result = patchGenerator(original);
    assert.equal((result.match(/resolveStandardEnum\(this,/g) || []).length, 4);
    assert.equal((result.match(/standardEnum \?\?/g) || []).length, 4);
    new vm.Script(result);
    assert.throws(() => patchGenerator(result), /Expected four/);
});

test("Installer: idempotence, hooks, reinstall and refusing unknown modifications", () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "sra-enum-tests-"));
    const tools = path.join(temp, "tools/sra-enums");
    function copyTree(from, to) {
        fs.mkdirSync(to, { recursive: true });
        for (const item of fs.readdirSync(from, { withFileTypes: true })) {
            if (item.isDirectory()) copyTree(path.join(from, item.name), path.join(to, item.name));
            else fs.copyFileSync(path.join(from, item.name), path.join(to, item.name));
        }
    }
    copyTree(__dirname, tools);
    const dict = path.join(temp, "node_modules/@sage/xtrem-x3-dictionary");
    const functions = path.join(dict, "build/lib/functions");
    fs.mkdirSync(functions, { recursive: true });
    const write = (filename, value) => fs.writeFileSync(filename, value);
    write(path.join(temp, "package.json"), JSON.stringify({ version: "64.0.82", scripts: { generate: "xtrem x3-dev generate --specific-only --service-name x3", postinstall: "npx --yes patch-package", pregenerate: "echo existing" } }));
    write(path.join(dict, "package.json"), JSON.stringify({ version: "64.0.82" }));
    const reference = name => fs.readFileSync(path.join(__dirname, "reference", name), "utf8");
    const helper = "x3-local-menu-dictionary-helper.js", generator = "x3-node-class-generator.js";
    write(path.join(functions, generator), reference(generator));
    write(path.join(functions, helper), reference(helper).replace(/'ENG'/g, "'FRA'"));
    for (const info of Object.values(standards)) {
        const pkg = path.join(temp, "node_modules", info.rootPackageName);
        fs.mkdirSync(path.join(pkg, "build/lib/enums"), { recursive: true });
        write(path.join(pkg, "package.json"), JSON.stringify({ version: "64.0.82" }));
        for (const ext of ["js", "d.ts"]) fs.copyFileSync(path.join(__dirname, "reference", info.filename + "." + ext), path.join(pkg, "build/lib/enums", info.filename + "." + ext));
    }
    const run = filename => spawnSync(process.execPath, [path.join(tools, filename)], { cwd: temp, encoding: "utf8" });
    let result = run("install.cjs"); assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(path.join(functions, helper), "utf8"), reference(helper));
    const first = fs.readFileSync(path.join(temp, "package.json"), "utf8");
    result = run("install.cjs"); assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(path.join(temp, "package.json"), "utf8"), first);
    const scripts = JSON.parse(first).scripts;
    assert.equal(scripts.postinstall, "npx --yes patch-package && node tools/sra-enums/apply.cjs");
    assert.equal(scripts.pregenerate, "echo existing && node tools/sra-enums/apply.cjs");
    write(path.join(functions, generator), reference(generator));
    result = run("apply.cjs"); assert.equal(result.status, 0, result.stderr);
    assert.match(fs.readFileSync(path.join(functions, generator), "utf8"), /resolveStandardEnum/);
    write(path.join(functions, generator), reference(generator) + "\n// another patch\n");
    result = run("apply.cjs"); assert.equal(result.status, 1); assert.match(result.stderr, /refusing to overwrite/);
    write(path.join(functions, generator), reference(generator));
    write(path.join(functions, helper), reference(helper) + "\n// other helper change\n");
    result = run("apply.cjs"); assert.equal(result.status, 1); assert.match(result.stderr, /Menu helper has changes/);
    assert.equal(fs.readFileSync(path.join(functions, generator), "utf8"), reference(generator));
    write(path.join(functions, helper), reference(helper));
    write(path.join(dict, "package.json"), JSON.stringify({ version: "65.0.0" }));
    result = run("apply.cjs"); assert.equal(result.status, 1); assert.match(result.stderr, /64.0.82/);
    write(path.join(dict, "package.json"), JSON.stringify({ version: "64.0.82" }));
    result = run("apply.cjs"); assert.equal(result.status, 0, result.stderr);
    result = run("uninstall.cjs"); assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(path.join(functions, generator), "utf8"), reference(generator));
    const restored = JSON.parse(fs.readFileSync(path.join(temp, "package.json"), "utf8")).scripts;
    assert.equal(restored.postinstall, "npx --yes patch-package");
    assert.equal(restored.pregenerate, "echo existing");
    assert.equal(fs.readFileSync(path.join(functions, helper), "utf8"), reference(helper));
    // Retain the temporary fixture for inspection; never touch the real installation.
    console.log("Installer test fixture: " + temp);
});
