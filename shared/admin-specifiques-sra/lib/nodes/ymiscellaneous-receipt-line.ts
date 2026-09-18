import * as sageX3MasterData from '@sage/x3-master-data';
import * as sageX3StockData from '@sage/x3-stock-data';
import * as sageX3System from '@sage/x3-system';
import { Collection, decimal, decorators, integer, Node, Reference } from '@sage/xtrem-core';
import { Joins, X3StorageManager } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<YmiscellaneousReceiptLine> = {
    referenceJoins: {
        product: {
            code: 'product',
        },
        packingUnit: {
            code: 'packingUnit',
        },
        stockUnit: {
            code: 'stockUnit',
        },
        bom: {
            bomType: 'bomType',
            code: 'bom',
        },
        warehouse: {
            code: 'warehouse',
        },
        majorVersion: {
            product: 'product',
            code: 'majorVersion',
        },
        ymiscellaneousReceipt: {
            entryType: 'entryType',
            id: 'id',
        },
    },
    collectionJoins: {
        stockDetails: {
            async stockSite() {
                return (await this.ymiscellaneousReceipt).stockSite;
            },
            documentType: 'entryType',
            documentId: 'id',
            documentLine: 'lineNumber',
        },
    },
};

@decorators.node<YmiscellaneousReceiptLine>({
    storage: 'external',
    tableName: 'SMVTD',
    keyPropertyNames: ['entryType', 'id', 'lineNumber'],
    indexes: [
        {
            orderBy: {
                entryType: 1,
                id: 1,
                lineNumber: 1,
            },
            isUnique: true,
            isNaturalKey: true,
        },
    ],
    externalStorageManager: new X3StorageManager({
        joins,
        joinFallbackProperties: ['entryType', 'lineNumber'],
    }),
    serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    isPublished: true,
    canRead: true,
    canSearch: true,
    canExport: false,
    isVitalCollectionChild: true,
    authorizationCode: 'GESSMR',
})
export class YmiscellaneousReceiptLine extends Node {
    @decorators.enumProperty<YmiscellaneousReceiptLine, 'entryType'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'VCRTYP',
        dataType: () => sageX3StockData.enums.entryTypeEnumDatatype,
    })
    readonly entryType: Promise<sageX3StockData.enums.EntryTypeEnum | null>;

    @decorators.stringProperty<YmiscellaneousReceiptLine, 'id'>({
        isPublished: true,
        isStored: true,
        columnName: 'VCRNUM',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly id: Promise<string>;

    @decorators.integerProperty<YmiscellaneousReceiptLine, 'lineNumber'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'VCRLIN',
    })
    readonly lineNumber: Promise<integer | null>;

    @decorators.referenceProperty<YmiscellaneousReceiptLine, 'product'>({
        isPublished: true,
        isStored: true,
        columnName: 'ITMREF',
        columnType: 'string',
        node: () => sageX3MasterData.nodes.Product,
        lookupAccess: true,
    })
    readonly product: Reference<sageX3MasterData.nodes.Product>;

    @decorators.stringProperty<YmiscellaneousReceiptLine, 'productDescription'>({
        isPublished: true,
        isStored: true,
        columnName: 'ITMDES1',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
        lookupAccess: true,
    })
    readonly productDescription: Promise<string>;

    @decorators.referenceProperty<YmiscellaneousReceiptLine, 'packingUnit'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'PCU',
        columnType: 'string',
        node: () => sageX3MasterData.nodes.UnitOfMeasure,
        lookupAccess: true,
    })
    readonly packingUnit: Reference<sageX3MasterData.nodes.UnitOfMeasure | null>;

    @decorators.decimalProperty<YmiscellaneousReceiptLine, 'quantityInPackingUnit'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'QTYPCU',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.decimalDatatype,
        lookupAccess: true,
    })
    readonly quantityInPackingUnit: Promise<decimal | null>;

    @decorators.decimalProperty<YmiscellaneousReceiptLine, 'packingUnitToStockUnitConversionFactor'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'PCUSTUCOE',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.decimalDatatype,
        lookupAccess: true,
    })
    readonly packingUnitToStockUnitConversionFactor: Promise<decimal | null>;

    @decorators.referenceProperty<YmiscellaneousReceiptLine, 'stockUnit'>({
        isPublished: true,
        isStored: true,
        columnName: 'STU',
        columnType: 'string',
        node: () => sageX3MasterData.nodes.UnitOfMeasure,
    })
    readonly stockUnit: Reference<sageX3MasterData.nodes.UnitOfMeasure>;

    @decorators.decimalProperty<YmiscellaneousReceiptLine, 'quantityInStockUnit'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'QTYSTU',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.decimalDatatype,
        lookupAccess: true,
    })
    readonly quantityInStockUnit: Promise<decimal | null>;

    @decorators.enumProperty<YmiscellaneousReceiptLine, 'priceType'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'UPDPRI',
        dataType: () => sageX3MasterData.enums.priceUpdateModeDatatype,
    })
    readonly priceType: Promise<sageX3MasterData.enums.PriceUpdateMode | null>;

    @decorators.decimalProperty<YmiscellaneousReceiptLine, 'price'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'PRI',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.decimalDatatype,
        lookupAccess: true,
    })
    readonly price: Promise<decimal | null>;

    @decorators.decimalProperty<YmiscellaneousReceiptLine, 'orderPrice'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'PRIORD',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.decimalDatatype,
    })
    readonly orderPrice: Promise<decimal | null>;

    @decorators.booleanProperty<YmiscellaneousReceiptLine, 'isUpdated'>({
        isPublished: true,
        isStored: true,
        columnName: 'UPDCOD',
    })
    readonly isUpdated: Promise<boolean>;

    @decorators.enumProperty<YmiscellaneousReceiptLine, 'lineType'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'LINTYP',
        dataType: () => sageX3StockData.enums.lineType2731Datatype,
    })
    readonly lineType: Promise<sageX3StockData.enums.LineType2731 | null>;

    @decorators.referenceProperty<YmiscellaneousReceiptLine, 'bom'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'BOMALT',
        columnType: 'integer',
        node: () => sageX3MasterData.nodes.BomCode,
    })
    readonly bom: Reference<sageX3MasterData.nodes.BomCode | null>;

    @decorators.enumProperty<YmiscellaneousReceiptLine, 'bomType'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'BOMALTTYP',
        dataType: () => sageX3MasterData.enums.bomCodeTypeDatatype,
    })
    readonly bomType: Promise<sageX3MasterData.enums.BomCodeType | null>;

    @decorators.integerProperty<YmiscellaneousReceiptLine, 'compoundLine'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'VCRLINPNT',
    })
    readonly compoundLine: Promise<integer | null>;

    @decorators.integerProperty<YmiscellaneousReceiptLine, 'importLine'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'IMPNUMLIG',
    })
    readonly importLine: Promise<integer | null>;

    @decorators.enumProperty<YmiscellaneousReceiptLine, 'sourceDocumentType'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'VCRTYPORI',
        dataType: () => sageX3StockData.enums.entryTypeEnumDatatype,
    })
    readonly sourceDocumentType: Promise<sageX3StockData.enums.EntryTypeEnum | null>;

    @decorators.stringProperty<YmiscellaneousReceiptLine, 'sourceDocument'>({
        isPublished: true,
        isStored: true,
        columnName: 'VCRNUMORI',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly sourceDocument: Promise<string>;

    @decorators.integerProperty<YmiscellaneousReceiptLine, 'sourceDocumentLine'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'VCRLINORI',
    })
    readonly sourceDocumentLine: Promise<integer | null>;

    @decorators.booleanProperty<YmiscellaneousReceiptLine, 'isReceiptIssueParent'>({
        isPublished: true,
        isStored: true,
        columnName: 'PNTMVTCOD',
    })
    readonly isReceiptIssueParent: Promise<boolean>;

    @decorators.decimalProperty<YmiscellaneousReceiptLine, 'originalQuantityInPackingUnit'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'QTYPCUORI',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.decimalDatatype,
    })
    readonly originalQuantityInPackingUnit: Promise<decimal | null>;

    @decorators.decimalProperty<YmiscellaneousReceiptLine, 'originalQuantityInStockUnit'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'QTYSTUORI',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.decimalDatatype,
    })
    readonly originalQuantityInStockUnit: Promise<decimal | null>;

    @decorators.referenceProperty<YmiscellaneousReceiptLine, 'warehouse'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'WRH',
        columnType: 'string',
        node: () => sageX3StockData.nodes.Warehouse,
        serviceOptions: () => [sageX3System.serviceOptions.WrhActivityCode],
    })
    readonly warehouse: Reference<sageX3StockData.nodes.Warehouse | null>;

    @decorators.referenceProperty<YmiscellaneousReceiptLine, 'majorVersion'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'ECCVALMAJ',
        columnType: 'string',
        node: () => sageX3MasterData.nodes.MajorVersionStatus,
        serviceOptions: () => [sageX3System.serviceOptions.EccActivityCode],
        lookupAccess: true,
    })
    readonly majorVersion: Reference<sageX3MasterData.nodes.MajorVersionStatus | null>;

    @decorators.stringProperty<YmiscellaneousReceiptLine, 'minorVersion'>({
        isPublished: true,
        isStored: true,
        columnName: 'ECCVALMIN',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
        serviceOptions: () => [sageX3System.serviceOptions.EccActivityCode],
        lookupAccess: true,
    })
    readonly minorVersion: Promise<string>;

    @decorators.stringProperty<YmiscellaneousReceiptLine, 'yxylolinent'>({
        isPublished: true,
        isStored: true,
        columnName: 'YXYLOLINENT',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly yxylolinent: Promise<string>;

    @decorators.referenceProperty<YmiscellaneousReceiptLine, 'ymiscellaneousReceipt'>({
        isPublished: true,
        isStored: true,
        isVitalParent: true,
        columnType: 'string',
        node: () => adminAdminSpecifiquesSra.nodes.YmiscellaneousReceipt,
        lookupAccess: true,
    })
    readonly ymiscellaneousReceipt: Reference<adminAdminSpecifiquesSra.nodes.YmiscellaneousReceipt>;

    @decorators.collectionProperty<YmiscellaneousReceiptLine, 'stockDetails'>({
        isPublished: true,
        node: () => sageX3StockData.nodes.StockJournal,
        isMutable: true,
        dependsOn: ['entryType', 'id', 'lineNumber'],
    })
    readonly stockDetails: Collection<sageX3StockData.nodes.StockJournal>;
}
