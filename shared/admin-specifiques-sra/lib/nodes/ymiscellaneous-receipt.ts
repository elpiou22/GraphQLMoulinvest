import * as sageX3FinanceData from '@sage/x3-finance-data';
import * as sageX3ProjectManagementData from '@sage/x3-project-management-data';
import * as sageX3StockData from '@sage/x3-stock-data';
import * as sageX3System from '@sage/x3-system';
import { Collection, Context, date, DateValue, decimal, decorators, integer, Node, Reference } from '@sage/xtrem-core';
import { Joins, X3StorageManager } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<YmiscellaneousReceipt> = {
    referenceJoins: {
        stockSite: {
            code: 'stockSite',
        },
        project: {
            id: 'project',
        },
        stockMovementGroup: {
            glossaryId() {
                return 9;
            },
            code: 'stockMovementGroup',
        },
        stockMovementCode: {
            glossaryId() {
                return 14;
            },
            code: 'stockMovementCode',
        },
        stockAutomaticJournal: {
            code: 'stockAutomaticJournal',
        },
        warehouse: {
            code: 'warehouse',
        },
    },
    collectionJoins: {
        ymiscellaneousReceiptLine: {
            entryType: 'entryType',
            id: 'id',
        },
    },
};

@decorators.node<YmiscellaneousReceipt>({
    storage: 'external',
    tableName: 'SMVTH',
    keyPropertyNames: ['entryType', 'id'],
    indexes: [
        {
            orderBy: {
                entryType: 1,
                id: 1,
            },
            isUnique: true,
            isNaturalKey: true,
        },
    ],
    externalStorageManager: new X3StorageManager({
        joins,
        joinFallbackProperties: ['entryType'],
    }),
    serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    isPublished: true,
    canRead: true,
    canSearch: true,
    canCreate: true,
    canExport: false,
    authorizationCode: 'GESSMR',
})
export class YmiscellaneousReceipt extends Node {
    @decorators.enumProperty<YmiscellaneousReceipt, 'entryType'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'VCRTYP',
        dataType: () => sageX3StockData.enums.entryTypeEnumDatatype,
    })
    readonly entryType: Promise<sageX3StockData.enums.EntryTypeEnum | null>;

    @decorators.stringProperty<YmiscellaneousReceipt, 'id'>({
        isPublished: true,
        isStored: true,
        columnName: 'VCRNUM',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly id: Promise<string>;

    @decorators.referenceProperty<YmiscellaneousReceipt, 'stockSite'>({
        isPublished: true,
        isStored: true,
        provides: ['site'],
        columnName: 'STOFCY',
        columnType: 'string',
        node: () => sageX3System.nodes.Site,
    })
    readonly stockSite: Reference<sageX3System.nodes.Site>;

    @decorators.dateProperty<YmiscellaneousReceipt, 'effectiveDate'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'IPTDAT',
        defaultValue() {
            return X3StorageManager.getDateDefaultValue(this);
        },
    })
    readonly effectiveDate: Promise<date | null>;

    @decorators.stringProperty<YmiscellaneousReceipt, 'documentDescription'>({
        isPublished: true,
        isStored: true,
        columnName: 'VCRDES',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly documentDescription: Promise<string>;

    @decorators.referenceProperty<YmiscellaneousReceipt, 'project'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'PJT',
        columnType: 'string',
        node: () => sageX3ProjectManagementData.nodes.ProjectLink,
        lookupAccess: true,
    })
    readonly project: Reference<sageX3ProjectManagementData.nodes.ProjectLink | null>;

    @decorators.referenceProperty<YmiscellaneousReceipt, 'stockMovementGroup'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'TRSFAM',
        columnType: 'string',
        filters: {
            lookup: {
                glossaryId: 9,
            },
            control: {
                glossaryId: 9,
            },
        },
        node: () => sageX3System.nodes.MiscellaneousTable,
        lookupAccess: true,
    })
    readonly stockMovementGroup: Reference<sageX3System.nodes.MiscellaneousTable | null>;

    @decorators.referenceProperty<YmiscellaneousReceipt, 'stockMovementCode'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'TRSCOD',
        columnType: 'string',
        filters: {
            lookup: {
                glossaryId: 14,
            },
            control: {
                glossaryId: 14,
            },
        },
        node: () => sageX3System.nodes.MiscellaneousTable,
    })
    readonly stockMovementCode: Reference<sageX3System.nodes.MiscellaneousTable | null>;

    @decorators.referenceProperty<YmiscellaneousReceipt, 'stockAutomaticJournal'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'ENTCOD',
        columnType: 'string',
        node: () => sageX3FinanceData.nodes.AutomaticJournal,
        lookupAccess: true,
    })
    readonly stockAutomaticJournal: Reference<sageX3FinanceData.nodes.AutomaticJournal | null>;

    @decorators.booleanProperty<YmiscellaneousReceipt, 'isValide'>({
        isPublished: true,
        isStored: true,
        columnName: 'CFMCOD',
    })
    readonly isValide: Promise<boolean>;

    @decorators.booleanProperty<YmiscellaneousReceipt, 'isValidated'>({
        isPublished: true,
        isStored: true,
        columnName: 'CFMFLG',
    })
    readonly isValidated: Promise<boolean>;

    @decorators.enumProperty<YmiscellaneousReceipt, 'sourceDocumentType'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'VCRTYPORI',
        dataType: () => sageX3StockData.enums.entryTypeEnumDatatype,
    })
    readonly sourceDocumentType: Promise<sageX3StockData.enums.EntryTypeEnum | null>;

    @decorators.stringProperty<YmiscellaneousReceipt, 'sourceDocumentId'>({
        isPublished: true,
        isStored: true,
        columnName: 'VCRNUMORI',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
        lookupAccess: true,
    })
    readonly sourceDocumentId: Promise<string>;

    @decorators.booleanProperty<YmiscellaneousReceipt, 'isDisassembly'>({
        isPublished: true,
        isStored: true,
        columnName: 'DBYFLG',
        lookupAccess: true,
    })
    readonly isDisassembly: Promise<boolean>;

    @decorators.referenceProperty<YmiscellaneousReceipt, 'warehouse'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'WRHE',
        columnType: 'string',
        node: () => sageX3StockData.nodes.Warehouse,
        serviceOptions: () => [sageX3System.serviceOptions.WrhActivityCode],
        lookupAccess: true,
    })
    readonly warehouse: Reference<sageX3StockData.nodes.Warehouse | null>;

    @decorators.decimalProperty<YmiscellaneousReceipt, 'disassemblyValue'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'DBYDEV',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.decimalDatatype,
        lookupAccess: true,
    })
    readonly disassemblyValue: Promise<decimal | null>;

    @decorators.integerProperty<YmiscellaneousReceipt, 'importLine'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'IMPNUMLIG',
    })
    readonly importLine: Promise<integer | null>;

    @decorators.collectionProperty<YmiscellaneousReceipt, 'ymiscellaneousReceiptLine'>({
        isPublished: true,
        isVital: true,
        reverseReference: 'ymiscellaneousReceipt',
        node: () => adminAdminSpecifiquesSra.nodes.YmiscellaneousReceiptLine,
        dependsOn: ['entryType', 'id'],
    })
    readonly ymiscellaneousReceiptLine: Collection<adminAdminSpecifiquesSra.nodes.YmiscellaneousReceiptLine>;

    @decorators.collectionProperty<YmiscellaneousReceipt, 'dimensions'>({
        isPublished: true,
        isVital: true,
        reverseReference: '_denormalizedParent',
        node: () => adminAdminSpecifiquesSra.nodes.YmiscellaneousReceiptDimensions,
    })
    readonly dimensions: Collection<adminAdminSpecifiquesSra.nodes.YmiscellaneousReceiptDimensions>;

    @decorators.mutation<typeof YmiscellaneousReceipt, 'createFromStatisticalGroups'>({
        /* RequestNodeName: CreateFromStatisticalGroups */
        isPublished: true,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
        parameters: [
            {
                name: 'parameters',
                type: 'object',
                properties: {
                    statisticalGroup1: {
                        isMandatory: true,
                        type: 'string',
                    },
                    statisticalGroup2: {
                        isMandatory: true,
                        type: 'string',
                    },
                    statisticalGroup3: {
                        isMandatory: true,
                        type: 'string',
                    },
                    id: {
                        isMandatory: true,
                        type: 'string',
                    },
                    stockSiteCode: {
                        isMandatory: true,
                        type: 'string',
                    },
                    effectiveDate: {
                        isMandatory: true,
                        type: 'date',
                    },
                    documentDescription: 'string',
                    stockMovementGroup: 'string',
                    packingUnit: {
                        isMandatory: true,
                        type: 'string',
                    },
                    quantityInPackingUnit: {
                        isMandatory: true,
                        type: 'decimal',
                    },
                    packingUnitToStockUnitConversionFactor: {
                        isMandatory: true,
                        type: 'decimal',
                    },
                    quantityInStockUnit: {
                        isMandatory: true,
                        type: 'decimal',
                    },
                },
            },
        ],
        return: {
            type: 'object',
            properties: {
                created: 'integer',
                message: 'string',
                matchCount: 'integer',
                productCode: 'string',
                receiptId: 'string',
            },
        },
    })
    static createFromStatisticalGroups(
        context: Context,
        parameters: {
            statisticalGroup1: string;
            statisticalGroup2: string;
            statisticalGroup3: string;
            id: string;
            stockSiteCode: string;
            effectiveDate: DateValue;
            documentDescription?: string;
            stockMovementGroup?: string;
            packingUnit: string;
            quantityInPackingUnit: decimal;
            packingUnitToStockUnitConversionFactor: decimal;
            quantityInStockUnit: decimal;
        },
    ): Promise<{
        created?: number;
        message?: string;
        matchCount?: number;
        productCode?: string;
        receiptId?: string;
    }> {
        return adminAdminSpecifiquesSra.functions.createMiscellaneousReceiptFromStats(context, parameters);
    }
}
