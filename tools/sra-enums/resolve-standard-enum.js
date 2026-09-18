"use strict";

const { X3LocalMenuDictionaryHelper: menus } = require("./x3-local-menu-dictionary-helper");
const { X3DictionaryHelper: sql } = require("./x3-dictionary-helper");
const standards = require("./sra-standard-enums.json");
const cache = new WeakMap();
const scope = {
    Coupe: { rateType: 202 },
    YmiscellaneousReceipt: { entryType: 701, sourceDocumentType: 701 },
    YmiscellaneousReceiptLine: {
        entryType: 701, sourceDocumentType: 701,
        priceType: 220, lineType: 2731, bomType: 224,
    },
    YmiscellaneousReceiptDimensions: { entryType: 701 },
};

async function resolveStandardEnum(generator, property) {
    if (generator.packageGenerator.metadata.name !== "@admin/admin-specifiques-sra") return undefined;
    const number = scope[property.nodeName]?.[property.name];
    if (!number || Number(property.localMenuNumber) !== number) return undefined;
    let entries = cache.get(generator);
    if (!entries) { entries = new Map(); cache.set(generator, entries); }
    if (!entries.has(number)) entries.set(number, resolve(generator, number));
    return entries.get(number);
}

async function resolve(generator, number) {
    const pool = generator.connPool;
    const folder = generator.x3FolderName;
    // Keep the native generator once its English dictionary is available.
    const english = await menus.getLocalMenuValues(pool, folder, number, "ENG");
    if (english.length) return undefined;
    const standard = standards[number];
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(folder)) throw new Error("SRA enums: unsupported folder identifier");
    const query = `SELECT aml.MENLOCAL_0, aml.CODACT_0, ex.AENUMNAM_0, ex.APACK_0
        FROM ${folder}.AMENLOC aml
        LEFT JOIN ${folder}.AENUMBDGH ex ON ex.AMENLOC_0 = aml.MENLOC_0
        WHERE aml.MENLOC_0 = ${number}`;
    const headers = await pool.withConnection(cnx => pool.createReader(cnx, query).readAll());
    const fail = reason => { throw new Error(`SRA enums ${number}: ${reason}; no automatic substitution`); };
    if (headers.length !== 1 || sql.fromSql("integer", headers[0].MENLOCAL_0) !== 2) fail("missing/invalid local menu");
    const header = headers[0];
    const activity = sql.fromSql("string", header.CODACT_0)?.trim();
    if (activity && /^[XYZ]/i.test(activity)) fail("custom activity code");
    const packageName = sql.fromSql("string", header.APACK_0)?.trim();
    const name = sql.fromSql("string", header.AENUMNAM_0)?.trim();
    if (packageName && packageName !== standard.rootPackageName) fail("conflicting enum package exception");
    if (name && !standard.acceptedNames.includes(name)) fail("conflicting enum name exception");
    const valuesQuery = `SELECT DISTINCT LANNUM_0 FROM ${folder}.APLSTD WHERE LANCHP_0 = ${number} AND LANNUM_0 > 0`;
    const values = await pool.withConnection(cnx => pool.createReader(cnx, valuesQuery).readAll());
    if (!values.length) fail("no local values");
    for (const row of values) {
        if (!standard.values[sql.fromSql("integer", row.LANNUM_0)]) fail("unknown local numeric value");
    }
    const overrides = await menus.getLocalMenuValueOverrideDbData(pool, folder);
    for (const row of overrides) {
        if (sql.fromSql("integer", row.AMENLOC_0) !== number) continue;
        const value = sql.fromSql("integer", row.LANNUM_0);
        if (value <= 0) continue;
        const key = sql.fromSql("string", row.AENUMVAL_0)?.trim();
        const owner = sql.fromSql("string", row.APACKVAL_0)?.trim();
        if (!standard.values[value] || (key && key !== standard.values[value])) fail("conflicting enum value exception");
        if (owner && owner !== standard.rootPackageName) fail("enum extension requires native generation");
    }
    console.warn(`[SRA enums] ${number}: English messages absent; using ${standard.rootPackageName}.enums.${standard.rootName}`);
    return {
        rootPackageName: standard.rootPackageName,
        rootName: standard.rootName,
        rootDataTypeName: standard.rootDataTypeName,
    };
}

exports.resolveStandardEnum = resolveStandardEnum;
