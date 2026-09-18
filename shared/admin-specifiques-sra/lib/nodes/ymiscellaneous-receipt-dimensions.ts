import * as sageX3FinanceData from '@sage/x3-finance-data';
import * as sageX3StockData from '@sage/x3-stock-data';
import { Context, decorators, integer, Node, Reference } from '@sage/xtrem-core';
import { Denormalized, Joins, X3StorageManager } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const denormalized: Denormalized = {
    maxRepeat: (context: Context) => sageXtremX3SystemUtils.getSizingFromActivityCode(context, 'ANA'),
};

const joins: Joins<YmiscellaneousReceiptDimensions> = {
    referenceJoins: {
        _denormalizedParent: {
            entryType: 'entryType',
            id: 'id',
        },
        dimensionType: {
            code: 'dimensionType',
        },
        dimension: {
            dimensionType: 'dimensionType',
            code: 'dimension',
        },
    },
};

@decorators.node<YmiscellaneousReceiptDimensions>({
    storage: 'external',
    tableName: 'SMVTH',
    keyPropertyNames: ['denormalizedIndex', 'entryType', 'id'],
    indexes: [],
    externalStorageManager: new X3StorageManager({
        joins,
        isDenormalized: true,
        denormalized,
    }),
    serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    isPublished: true,
    canRead: true,
    canSearch: true,
    canExport: false,
    isVitalCollectionChild: true,
})
export class YmiscellaneousReceiptDimensions extends Node {
    @decorators.integerProperty<YmiscellaneousReceiptDimensions, 'denormalizedIndex'>({
        isPublished: true,
        lookupAccess: true,
    })
    readonly denormalizedIndex: Promise<integer>;

    @decorators.enumProperty<YmiscellaneousReceiptDimensions, 'entryType'>({
        isPublished: true,
        isStored: true,
        columnName: 'VCRTYP',
        dataType: () => sageX3StockData.enums.entryTypeEnumDatatype,
    })
    readonly entryType: Promise<sageX3StockData.enums.EntryTypeEnum>;

    @decorators.stringProperty<YmiscellaneousReceiptDimensions, 'id'>({
        isPublished: true,
        isStored: true,
        isNotEmpty: true,
        columnName: 'VCRNUM',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly id: Promise<string>;

    @decorators.referenceProperty<YmiscellaneousReceiptDimensions, '_denormalizedParent'>({
        isStored: true,
        isVitalParent: true,
        columnType: 'string',
        node: () => adminAdminSpecifiquesSra.nodes.YmiscellaneousReceipt,
    })
    readonly _denormalizedParent: Reference<adminAdminSpecifiquesSra.nodes.YmiscellaneousReceipt>;

    @decorators.referenceProperty<YmiscellaneousReceiptDimensions, 'dimensionType'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'DIE',
        columnType: 'string',
        node: () => sageX3FinanceData.nodes.DimensionType,
        lookupAccess: true,
    })
    readonly dimensionType: Reference<sageX3FinanceData.nodes.DimensionType | null>;

    @decorators.referenceProperty<YmiscellaneousReceiptDimensions, 'dimension'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'CCE',
        columnType: 'string',
        node: () => sageX3FinanceData.nodes.Dimension,
        lookupAccess: true,
    })
    readonly dimension: Reference<sageX3FinanceData.nodes.Dimension | null>;
}
