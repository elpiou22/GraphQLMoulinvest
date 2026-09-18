"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.X3LocalMenuDictionaryHelper = void 0;
const xtrem_core_1 = require("@sage/xtrem-core");
const xtrem_i18n_1 = require("@sage/xtrem-i18n");
const xtrem_log_1 = require("@sage/xtrem-log");
const xtrem_shared_1 = require("@sage/xtrem-shared");
const xtrem_x3_gateway_1 = require("@sage/xtrem-x3-gateway");
const _ = __importStar(require("lodash"));
const x3_dictionary_helper_1 = require("./x3-dictionary-helper");
const x3_dictionary_interfaces_1 = require("./x3-dictionary-interfaces");
const x3_package_dictionary_helper_1 = require("./x3-package-dictionary-helper");
const logger = xtrem_log_1.Logger.getLogger(__filename, 'x3-dictionary-helper');
class X3LocalMenuDictionaryHelper {
    static async getCustomLocalMenuRanges(connPool, x3Folder) {
        if (this.customLocalMenuRanges)
            return this.customLocalMenuRanges;
        const referenceFolder = (await x3_dictionary_helper_1.X3DictionaryHelper.getReferenceFolderFromParam(connPool, x3Folder)) || x3Folder;
        let selectClause = `RAN_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('RAN_0', connPool.dialect)}`;
        for (let index = 1; index < 99; index += 1) {
            const columnName = `RAN_${index}`;
            selectClause = `${selectClause},${columnName} ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias(columnName, connPool.dialect)}`;
        }
        const sql = `SELECT ${selectClause} FROM ${referenceFolder}.ACTLDEV WHERE COD_0 LIKE 'ADDON%' OR COD_0 IN ('VER','SPE')`;
        try {
            const result = await connPool.withConnection(cnx => {
                return connPool.createReader(cnx, sql, [], {}).readAll();
            });
            const list = [];
            result.forEach(rangeList => {
                for (let index = 0; index < 99; index += 1) {
                    const rangeEntry = rangeList[`RAN_${index}`];
                    if (!rangeEntry && rangeEntry === ' ')
                        break;
                    const rangeElements = String(rangeEntry).split('-');
                    if (rangeElements.length !== 2)
                        break;
                    if (rangeElements.every(element => Number.isFinite(Number(element))))
                        list.push({ from: Number(rangeElements[0]), to: Number(rangeElements[1]) });
                }
            });
            this.customLocalMenuRanges = list;
            return this.customLocalMenuRanges;
        }
        catch {
            return [];
        }
    }
    static async isCustomLocalMenu(connPool, x3Folder, localMenuNumber) {
        const ranges = await this.getCustomLocalMenuRanges(connPool, x3Folder);
        return !!ranges.find(range => localMenuNumber >= range.from && localMenuNumber <= range.to);
    }
    static { this.localMenusPerPackage = (0, xtrem_shared_1.createDictionary)(); }
    static { this.localMenuValues = (0, xtrem_shared_1.createDictionary)(); }
    static { this.localMenus = (0, xtrem_shared_1.createDictionary)(); }
    static { this.localMenuHeaders = (0, xtrem_shared_1.createDictionary)(); }
    static { this.translationsLocalMenuDefinitions = (0, xtrem_shared_1.createDictionary)(); }
    static clearCache() {
        X3LocalMenuDictionaryHelper.localMenuHeaderData = undefined;
        X3LocalMenuDictionaryHelper.localMenusPerPackage = (0, xtrem_shared_1.createDictionary)();
        X3LocalMenuDictionaryHelper.localMenuValueOverrideDbData = undefined;
        X3LocalMenuDictionaryHelper.localMenuValues = (0, xtrem_shared_1.createDictionary)();
        X3LocalMenuDictionaryHelper.localMenus = (0, xtrem_shared_1.createDictionary)();
        X3LocalMenuDictionaryHelper.localMenuHeaders = (0, xtrem_shared_1.createDictionary)();
        X3LocalMenuDictionaryHelper.translationsLocalMenuDefinitions = (0, xtrem_shared_1.createDictionary)();
    }
    /**
     * Query the header of local menues
     *
     * Passing 'currentPackage' parameter limits the search to the current package
     * and is used for generation/update i18n translation files
     *
     * @param connPool
     * @param x3Folder
     * @param currentPackage optional parameter for i18n translation files generator
     * @returns
     */
    static async loadLocalMenuHeaders(connPool, x3Folder) {
        if (this.localMenuHeaderData)
            return this.localMenuHeaderData;
        /**
         * Rule for getting the local menu title
         * if the local menu chapter is less that 100, we look for the title in the values of local menu 0,
         * using the local menu chapter as the value number
         * if the local menu chapter is greater than 100, we look for the title in the values of local menu 200,
         * using the local menu chapter minus 200 as the value number
         */
        const localMenuHeaderSql = `SELECT
                                    aml.MENLOC_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('MENLOC_0', connPool.dialect)},
                                    aml.MODULE_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('MODULE_0', connPool.dialect)},
                                    aml.CODACT_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('CODACT_0', connPool.dialect)},
                                    aebh.APACK_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('OVERRIDE_PACKAGE', connPool.dialect)},
                                    titchp1.LANMES_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('MAIN_TITLE', connPool.dialect)},
                                    aebh.AENUMNAM_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('OVERRIDE_NAME', connPool.dialect)}
                                FROM
                                ${x3Folder}.AMENLOC aml
                                LEFT JOIN ${x3Folder}.APLSTD titchp1 ON
                                    ((aml.MENLOC_0<100
                                        AND titchp1.LANCHP_0 = 0
                                        AND titchp1.LANNUM_0 = aml.MENLOC_0)
                                    OR (aml.MENLOC_0 >= 100
                                        AND titchp1.LANCHP_0 = 200
                                        AND titchp1.LANNUM_0 = aml.MENLOC_0-200))
                                    AND titchp1.LAN_0 = 'ENG'
                                LEFT JOIN ${x3Folder}.AENUMBDGH aebh ON aml.MENLOC_0 = aebh.AMENLOC_0
                                WHERE
                                    aml.MENLOCAL_0 = 2
                                    AND (EXISTS (SELECT 1 FROM ${x3Folder}.APLSTD apl WHERE apl.LANCHP_0 = aml.MENLOC_0 AND apl.LAN_0 = 'ENG') OR aml.AUZMOD_0 = 2)
                                ORDER BY aml.MENLOC_0`;
        this.localMenuHeaderData = await connPool.withConnection(cnx => {
            return connPool.createReader(cnx, localMenuHeaderSql).readAll();
        });
        return this.localMenuHeaderData;
    }
    static async buildLocalMenuHeader(connPool, x3Folder, record, packageDefinition) {
        const localMenuNumber = x3_dictionary_helper_1.X3DictionaryHelper.fromSql('integer', record.MENLOC_0);
        const overriddenPackageName = x3_dictionary_helper_1.X3DictionaryHelper.fromSql('string', record.OVERRIDE_PACKAGE);
        const packages = await x3_package_dictionary_helper_1.X3PackageDictionaryHelper.getPackages(connPool, x3Folder, packageDefinition.serviceName);
        const module = x3_dictionary_helper_1.X3DictionaryHelper.fromSql('integer', record.MODULE_0);
        const activityCode = x3_dictionary_helper_1.X3DictionaryHelper.fromSql('string', record.CODACT_0);
        const activityCodePackageName = activityCode
            ? packages.find(pack => pack.activityCode === activityCode && pack.module === module && pack.isMain)?.name
            : undefined;
        const activityCodeDataPackage = activityCodePackageName
            ? packages.find(pack => pack.name === `${activityCodePackageName}-data`)?.name
            : undefined;
        let modulePackageName = packages.find(pack => pack.activityCode == null && pack.module === module && pack.isMain)?.name;
        const isCustom = await this.isCustomLocalMenu(connPool, x3Folder, x3_dictionary_helper_1.X3DictionaryHelper.fromSql('integer', record.MENLOC_0));
        if (isCustom && !activityCodePackageName && !overriddenPackageName)
            logger.error(`Cannot determine package for local menu ${localMenuNumber}`);
        const moduleDataPackage = packages.find(pack => pack.name === `${modulePackageName}-data`)?.name;
        if (!isCustom && !modulePackageName && !moduleDataPackage && !overriddenPackageName) {
            // TODO: after we settle, we need to make this an error rather than falling back on master-data
            modulePackageName = x3_dictionary_interfaces_1.platformPackages.masterData(packageDefinition.serviceName);
            logger.error(`Cannot determine package for local menu ${localMenuNumber}, enum will be create in ${modulePackageName}`);
        }
        const description = String(x3_dictionary_helper_1.X3DictionaryHelper.fromSql('string', record.MAIN_TITLE) || `Local menu ${localMenuNumber}`).trim();
        const santizedDescription = description.replace(/[^A-Za-z0-9\\/.,\-_ ]/g, '');
        const name = _.upperFirst(_.camelCase(/^[A-Za-z]/.test(santizedDescription) ? santizedDescription : `Enum ${santizedDescription}`));
        let overriddenName = _.upperFirst(x3_dictionary_helper_1.X3DictionaryHelper.fromSql('string', record.OVERRIDE_NAME));
        let issue;
        if (!x3_dictionary_helper_1.X3DictionaryHelper.fromSql('string', record.MAIN_TITLE) && !overriddenName) {
            issue = `Local menu ${record.MENLOC_0} title is empty`;
        }
        const found = Object.values(this.localMenuHeaders).find(localMenu => (localMenu.overriddenName || localMenu.name) === (overriddenName || name));
        if (found) {
            const duplicateName = overriddenName || name;
            const namePrefix = duplicateName || 'LocalMenu';
            issue = `Local menu ${record.MENLOC_0} and ${found.localMenuNumber} share the same name, please load an enum exception for one of them with a name other than ${duplicateName}. ${record.MENLOC_0} = ${duplicateName} and ${found.localMenuNumber} = ${found.overriddenName || found.name}, falling back to ${namePrefix}${localMenuNumber} `;
            logger.error(issue);
            // The current local menu has an exception, which takes precendence, we will update the name of the local menu found
            if (overriddenName) {
                this.localMenuHeaders[String(found.localMenuNumber)].overriddenName =
                    `${namePrefix}${found.localMenuNumber}`;
            }
            else {
                overriddenName = `${namePrefix}${localMenuNumber}`;
            }
        }
        return {
            localMenuNumber: x3_dictionary_helper_1.X3DictionaryHelper.fromSql('integer', record.MENLOC_0),
            description,
            module: x3_dictionary_helper_1.X3DictionaryHelper.fromSql('integer', record.MODULE_0),
            activityCode,
            overriddenPackageName,
            modulePackageName: moduleDataPackage ?? modulePackageName,
            activityCodePackageName: activityCodeDataPackage ?? activityCodePackageName,
            overriddenName,
            isCustom,
            name,
            issue,
        };
    }
    static setPackageLocalMenuHeader(packageName, localMenuHeader) {
        if (!this.localMenusPerPackage[packageName])
            this.localMenusPerPackage[packageName] = (0, xtrem_shared_1.createDictionary)();
        this.localMenusPerPackage[packageName][localMenuHeader.localMenuNumber] = localMenuHeader;
    }
    static isValidLocalMenu(record, packageDefinition) {
        if (x3_dictionary_helper_1.X3DictionaryHelper.fromSql('integer', record.MENLOC_0) === 1)
            return false;
        if (packageDefinition.isCustom)
            return true;
        if ([10, 11, 15, 16, 17, 18, 19, 20].includes(x3_dictionary_helper_1.X3DictionaryHelper.fromSql('integer', record.MODULE_0)))
            return false;
        const activityCode = x3_dictionary_helper_1.X3DictionaryHelper.fromSql('string', record.CODACT_0);
        const localMenuNumber = x3_dictionary_helper_1.X3DictionaryHelper.fromSql('integer', record.MENLOC_0);
        if (packageDefinition.serviceName === 'x3' &&
            [
                'AD5',
                'ANGMI',
                'ASD',
                'BIL',
                'BTP',
                'CAR',
                'CQH',
                'DCP',
                'DEVUK',
                'EPA',
                'EPAY',
                'EQM',
                'EVAEN',
                'FRT',
                'GCRM',
                'GLM',
                'HIC',
                'HISCT',
                'HRCOM',
                'HRDEM',
                'HREMP',
                'HRESM',
                'HRESS',
                'HRFRM',
                'HRHRM',
                'HRNOF',
                'HRPAY',
                'HRTAT',
                'HRVII',
                'INTMT',
                'JNT',
                'KBW',
                'KCD',
                'KEG',
                'KET',
                'KGH',
                'KJO',
                'KKE',
                'KLS',
                'KMA',
                'KML',
                'KMU',
                'KMW',
                'KMZ',
                'KNA',
                'KNG',
                'KNZ',
                'KRW',
                'KSCO',
                'KSZ',
                'KTH',
                'KTZ',
                'KUG',
                'KYAFR',
                'KZM',
                'KZW',
                'LOA',
                'MAL',
                'MAS',
                'MTT',
                'NGT',
                'PAI',
                'PAPI',
                'PAR',
                'PERID',
                'PORMI',
                'PRH',
                'PYS',
                'SDM',
                'SMI',
                'SRV',
                'TPS',
                'TRH',
                'VEP',
                'VISAF',
            ].includes(activityCode))
            return false;
        if (packageDefinition.serviceName === 'wh' &&
            [
                'AD5',
                'CPT',
                'JDE',
                'KMA',
                'KPL',
                'KPO',
                'KRU',
                'KSA',
                'KSP',
                'KSW',
                'KUK',
                'KUS',
                'KZA',
                'PAI',
                'PYS',
                'REX',
            ].includes(activityCode))
            return false;
        // The range of values to be excluded for HR Local menus is 10301 to 11999.
        // For HR Portal we can exclude also from 9300 to 9322.
        if ((localMenuNumber >= 10301 && localMenuNumber <= 11999) ||
            (localMenuNumber >= 9300 && localMenuNumber <= 9322))
            return false;
        return true;
    }
    /**
     * Load all the relevant local menues of a package that relate to a node property
     * @param connPool
     * @param x3Folder
     * @param packageName
     * @returns
     */
    static async loadPackageLocalMenuHeaders(connPool, x3Folder, packageDefinition) {
        if (this.localMenusPerPackage[packageDefinition.name])
            return this.localMenusPerPackage[packageDefinition.name];
        this.localMenusPerPackage[packageDefinition.name] = (0, xtrem_shared_1.createDictionary)();
        const localMenuHeaders = await this.loadLocalMenuHeaders(connPool, x3Folder);
        await (0, xtrem_core_1.asyncArray)(localMenuHeaders).forEach(async (record) => {
            // For internal packages we exclude deprecated and reduntant modules
            if (!this.isValidLocalMenu(record, packageDefinition))
                return;
            const localMenuHeader = this.localMenuHeaders[String(record.MENLOC_0)] ??
                (await this.buildLocalMenuHeader(connPool, x3Folder, record, packageDefinition));
            if (!this.localMenuHeaders[String(record.MENLOC_0)])
                this.localMenuHeaders[String(localMenuHeader.localMenuNumber)] = localMenuHeader;
            const definingPackage = this.getPackageFromHeader(localMenuHeader);
            // Allocate the local menu header to its definingPackage and each package there is an extension
            if (definingPackage) {
                this.setPackageLocalMenuHeader(definingPackage, localMenuHeader);
                const enumExtensionPackages = (await this.getLocalMenuValueOverrideDbData(connPool, x3Folder))
                    .filter(row => x3_dictionary_helper_1.X3DictionaryHelper.fromSql('integer', row.AMENLOC_0) === localMenuHeader.localMenuNumber)
                    .map(dbProp => x3_dictionary_helper_1.X3DictionaryHelper.fromSql('string', dbProp.APACKVAL_0))
                    .filter((overridePackage) => overridePackage && overridePackage !== definingPackage);
                // Add the local menu header to the packages it is extended on.
                enumExtensionPackages.forEach(enumExtensionPackage => this.setPackageLocalMenuHeader(enumExtensionPackage, localMenuHeader));
            }
        });
        return this.localMenusPerPackage[packageDefinition.name] || {};
    }
    /**
     * Get the header details of an enum
     * @param connPool
     * @param x3Folder
     * @param localMenuNumber
     * @returns
     */
    static async getLocalMenuHeader(connPool, x3Folder, localMenuNumber, packageDefinition) {
        if (this.localMenuHeaders[String(localMenuNumber)])
            return this.localMenuHeaders[String(localMenuNumber)];
        const headerData = await this.loadLocalMenuHeaders(connPool, x3Folder);
        const result = headerData.filter(r => localMenuNumber === x3_dictionary_helper_1.X3DictionaryHelper.fromSql('integer', r.MENLOC_0));
        if (result.length === 0)
            throw new Error(`Cannot determine header for local menu ${localMenuNumber}.`);
        this.localMenuHeaders[String(localMenuNumber)] = await this.buildLocalMenuHeader(connPool, x3Folder, result[0], packageDefinition);
        return this.localMenuHeaders[String(localMenuNumber)];
    }
    static async getLocalMenuValueOverrideDbData(connPool, x3Folder) {
        if (this.localMenuValueOverrideDbData)
            return this.localMenuValueOverrideDbData;
        const overrideQuery = `SELECT aedbl.AMENLOC_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('AMENLOC_0', connPool.dialect)},aedbl.LANNUM_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('LANNUM_0', connPool.dialect)}, AENUMVAL_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('AENUMVAL_0', connPool.dialect)}, APACKVAL_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('APACKVAL_0', connPool.dialect)}
                                FROM
                                    ${x3Folder}.AENUMBDGL aedbl ORDER BY aedbl.AMENLOC_0, aedbl.LANNUM_0 ASC`;
        this.localMenuValueOverrideDbData = await connPool.withConnection(cnx => {
            return connPool.createReader(cnx, overrideQuery).readAll();
        });
        return this.localMenuValueOverrideDbData;
    }
    static async getLocalMenuValueOverride(connPool, x3Folder, localMenuNumber, valueNumber) {
        const data = await this.getLocalMenuValueOverrideDbData(connPool, x3Folder);
        const result = data.filter(row => x3_dictionary_helper_1.X3DictionaryHelper.fromSql('integer', row.AMENLOC_0) === localMenuNumber &&
            x3_dictionary_helper_1.X3DictionaryHelper.fromSql('integer', row.LANNUM_0) === valueNumber);
        if (result.length === 0)
            return undefined;
        return {
            value: x3_dictionary_helper_1.X3DictionaryHelper.fromSql('string', result[0].AENUMVAL_0),
            packageName: x3_dictionary_helper_1.X3DictionaryHelper.fromSql('string', result[0].APACKVAL_0),
        };
    }
    static async getLocalMenuValues(connPool, x3Folder, localMenuNumber, language, valueNumber) {
        const key = `${String(localMenuNumber)}~${language}`;
        if (!this.localMenuValues[key]) {
            const localMenuNumbersSql = `SELECT
                                    apl.LANCHP_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('LANCHP_0', connPool.dialect)},
                                    apl.LANNUM_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('LANNUM_0', connPool.dialect)},
                                    apl.LANMES_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('LANMES_0', connPool.dialect)},
                                    tla.LANISO_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('LANISO_0', connPool.dialect)}
                                FROM
                                    ${x3Folder}.APLSTD apl
                                    LEFT JOIN ${x3Folder}.TABLAN tla ON apl.LAN_0 = tla.LAN_0
                                WHERE
                                apl.LANCHP_0 = ${localMenuNumber}
                                AND apl.LAN_0 = '${language}'
                                AND apl.LANNUM_0>0 ORDER BY apl.LANNUM_0`;
            // Get a distinct list of the local menu values
            this.localMenuValues[key] = (await connPool.withConnection(cnx => {
                return connPool.createReader(cnx, localMenuNumbersSql).readAll();
            })).map(record => ({
                valueNumber: x3_dictionary_helper_1.X3DictionaryHelper.fromSql('integer', record.LANNUM_0),
                description: x3_dictionary_helper_1.X3DictionaryHelper.fromSql('string', record.LANMES_0),
                isoLanguage: x3_dictionary_helper_1.X3DictionaryHelper.fromSql('string', record.LANISO_0),
            }));
        }
        if (valueNumber)
            return this.localMenuValues[key].filter(val => val.valueNumber === valueNumber);
        return this.localMenuValues[key];
    }
    static fixName(name) {
        if (['true', 'false', 'null'].includes(name))
            return `is${_.startCase(name)}`;
        return name;
    }
    //
    static async getLocalMenuValueTranslations(connPool, x3Folder, localMenuNumber, language = 'ENG') {
        const localMenuValue = await this.getLocalMenuValues(connPool, x3Folder, localMenuNumber, language);
        return (0, xtrem_core_1.asyncArray)(localMenuValue)
            .map(async (lmv) => {
            const { valueNumber } = lmv;
            const engLocalMenuValue = await this.getLocalMenuValues(connPool, x3Folder, localMenuNumber, 'ENG', valueNumber);
            const override = await this.getLocalMenuValueOverride(connPool, x3Folder, localMenuNumber, valueNumber);
            let friendlyName = engLocalMenuValue.length === 0
                ? `substituteValue${valueNumber}`
                : _.camelCase(engLocalMenuValue[0].description);
            // An enum key cannot start with
            if (/^[0-9]/.test(friendlyName) || !friendlyName)
                friendlyName = `substituteValue${valueNumber}`;
            const description = localMenuValue.length === 0 ? friendlyName : lmv.description;
            const isoLanguage = localMenuValue.length === 0 ? 'en-US' : lmv.isoLanguage;
            const name = this.fixName(override?.value ?? friendlyName);
            return {
                valueNumber,
                name,
                packageName: override?.packageName,
                description,
                isoLanguage,
            };
        })
            .toArray();
    }
    //
    /**
     * Get the list of numeric values and string keys of a local menu to be used in the enum definition
     * @param connPool
     * @param x3Folder
     * @param localMenuNumber
     * @param valueNumber
     * @param language
     * @returns
     */
    static async getLocalMenuValue(connPool, x3Folder, localMenuNumber, valueNumber, language = 'ENG') {
        const override = await this.getLocalMenuValueOverride(connPool, x3Folder, localMenuNumber, valueNumber);
        const localMenuValue = await this.getLocalMenuValues(connPool, x3Folder, localMenuNumber, language, valueNumber);
        const engLocalMenuValue = await this.getLocalMenuValues(connPool, x3Folder, localMenuNumber, 'ENG', valueNumber);
        let friendlyName = engLocalMenuValue.length === 0
            ? `substituteValue${valueNumber}`
            : _.camelCase(engLocalMenuValue[0].description).replace(/[^a-zA-Z0-9\-_ ]/g, '');
        // An enum key cannot start with
        if (/^[0-9]/.test(friendlyName) || !friendlyName)
            friendlyName = `substituteValue${valueNumber}`;
        const description = localMenuValue.length === 0 ? friendlyName : localMenuValue[0].description;
        const isoLanguage = localMenuValue.length === 0 ? 'en-US' : localMenuValue[0].isoLanguage;
        const name = this.fixName(override?.value ?? friendlyName);
        return {
            valueNumber,
            name,
            definingPackage: override?.packageName,
            description,
            isoLanguage,
        };
    }
    /**
     * Get local menu defintion that will be used to generate the enum definition
     * @param connPool
     * @param x3Folder
     * @param localMenuNumber
     * @param currentPackage
     * @returns
     */
    static async getLocalMenuDefinition(connPool, x3Folder, localMenuNumber, currentPackage) {
        if (this.localMenus[String(localMenuNumber)])
            return this.localMenus[String(localMenuNumber)];
        await this.loadPackageLocalMenuHeaders(connPool, x3Folder, currentPackage);
        let header = this.localMenusPerPackage[currentPackage.name][String(localMenuNumber)];
        // If the header is not from the current package load from the DB
        if (!header)
            header = await this.getLocalMenuHeader(connPool, x3Folder, localMenuNumber, currentPackage);
        const localMenuNumbersSql = `SELECT DISTINCT
                                    apl.LANCHP_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('LANCHP_0', connPool.dialect)},
                                    apl.LANNUM_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('LANNUM_0', connPool.dialect)}
                                FROM
                                    ${x3Folder}.APLSTD apl
                                WHERE
                                apl.LANCHP_0 = ${localMenuNumber} AND apl.LANNUM_0>0 ORDER BY apl.LANNUM_0`;
        // Get a distinct list of the local menu values
        const localMenuNumbers = await connPool.withConnection(cnx => {
            return connPool.createReader(cnx, localMenuNumbersSql).readAll();
        });
        let values;
        const definingPackage = X3LocalMenuDictionaryHelper.getPackageFromHeader(header, { doNotThrow: true });
        if (localMenuNumbers.length === 0) {
            logger.error(`No values found for local menu ${localMenuNumber}. Adding dummy value`);
            values = [
                {
                    valueNumber: 0,
                    name: 'dummyValue',
                    definingPackage,
                    description: 'Dummy value',
                    isoLanguage: 'ENG',
                },
            ];
        }
        else {
            // Retrieve the local menu name to be used as the value key on the enum
            values = await (0, xtrem_core_1.asyncArray)(localMenuNumbers)
                .map(record => this.getLocalMenuValue(connPool, x3Folder, localMenuNumber, x3_dictionary_helper_1.X3DictionaryHelper.fromSql('integer', record.LANNUM_0)))
                .toArray();
        }
        values.forEach((v, i) => {
            if (values.filter(v2 => v2.name === v.name).length > 1) {
                values[i].name = `${v.name}${v.valueNumber}`;
            }
        });
        const extensionPackages = definingPackage
            ? values
                .filter(v => v.definingPackage != null && v.definingPackage !== definingPackage)
                .map(v => v.definingPackage ?? '')
            : [];
        this.localMenus[String(localMenuNumber)] = { ...header, values, extensionPackages };
        return this.localMenus[String(localMenuNumber)];
    }
    static getPackageFromHeader(localMenuDefinition, options) {
        if (localMenuDefinition.overriddenPackageName)
            return localMenuDefinition.overriddenPackageName;
        if (localMenuDefinition.isCustom && !localMenuDefinition.activityCodePackageName) {
            logger.error(`Cannot establish a package for custom local menu ${localMenuDefinition.localMenuNumber}`);
        }
        const packageName = localMenuDefinition.activityCodePackageName || localMenuDefinition.modulePackageName;
        if (!packageName) {
            if (options?.doNotThrow || localMenuDefinition.isCustom) {
                logger.error(`Cannot establish a package for local menu ${localMenuDefinition.localMenuNumber}`);
                return undefined;
            }
            throw new Error(`Cannot establish a package for local menu ${localMenuDefinition.localMenuNumber}`);
        }
        return packageName;
    }
    /**
     * Get local menu definition that will be used to generate the enum definition
     * @param connPool
     * @param x3Folder
     * @param localMenuNumber
     * @param currentPackage
     * @returns
     */
    static async getTranslationLocalMenuDefinition(connPool, x3Folder, localMenuNumber, currentPackage) {
        if (this.translationsLocalMenuDefinitions[localMenuNumber])
            return this.translationsLocalMenuDefinitions[localMenuNumber];
        await this.loadPackageLocalMenuHeaders(connPool, x3Folder, currentPackage);
        const header = this.localMenusPerPackage[currentPackage.name][String(localMenuNumber)];
        // If the header is not from the current package load from the DB
        if (!header) {
            throw new Error(`Cannot determine header for local menu ${localMenuNumber}.`);
        }
        const localMenuNumbersSql = `SELECT DISTINCT
                                    apl.LANCHP_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('LANCHP_0', connPool.dialect)},
                                    apl.LANNUM_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('LANNUM_0', connPool.dialect)},
                                    apl.LAN_0 ${xtrem_x3_gateway_1.SqlResolver.makeColumnAlias('LAN_0', connPool.dialect)}
                                FROM
                                    ${x3Folder}.APLSTD apl
                                WHERE
                                apl.LANCHP_0 = ${localMenuNumber} AND apl.LANNUM_0>0 ORDER BY apl.LAN_0, apl.LANCHP_0`;
        // Get a distinct list of the local menu values
        const localMenuNumbers = await connPool.withConnection(cnx => {
            return connPool.createReader(cnx, localMenuNumbersSql).readAll();
        });
        if (localMenuNumbers.length === 0) {
            logger.error(`No values found for local menu ${localMenuNumber}.`);
            return {};
        }
        const i18nLocalMenuValues = await (0, xtrem_core_1.asyncArray)(localMenuNumbers).reduce(async (acc, curVal) => {
            const result = await this.getLocalMenuValueTranslations(connPool, x3Folder, localMenuNumber, x3_dictionary_helper_1.X3DictionaryHelper.fromSql('string', curVal.LAN_0));
            return acc.concat(result);
        }, []);
        const enumsByLang = (0, xtrem_shared_1.createDictionary)();
        i18nLocalMenuValues.forEach(lm => {
            const packageName = header.overriddenPackageName || header.activityCodePackageName || header.modulePackageName;
            if (lm.definingPackage && packageName !== lm.definingPackage)
                return;
            const enumKey = (0, xtrem_i18n_1.enumNameToStringKey)(`${packageName || ''}/${header.overriddenName || header.name}`, lm.name);
            if (lm.isoLanguage) {
                if (!enumsByLang[lm.isoLanguage]) {
                    enumsByLang[lm.isoLanguage] = {
                        enums: {},
                    };
                }
                _.merge(enumsByLang[lm.isoLanguage].enums, { [enumKey]: lm.description });
            }
            else {
                logger.warn(`ISO Language for translation local menu definition ${lm.name} is not defined`);
            }
        });
        this.translationsLocalMenuDefinitions[localMenuNumber] = enumsByLang;
        return this.translationsLocalMenuDefinitions[localMenuNumber];
    }
}
exports.X3LocalMenuDictionaryHelper = X3LocalMenuDictionaryHelper;
//# sourceMappingURL=x3-local-menu-dictionary-helper.js.map