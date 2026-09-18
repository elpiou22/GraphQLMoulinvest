import * as sageX3System from '@sage/x3-system';
import { date, decorators, integer, Node, Reference } from '@sage/xtrem-core';
import { Joins, X3StorageManager } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<OpporSta> = {
    referenceJoins: {
        coupeId: {
            id: 'coupeId',
        },
        stex: {
            glossaryId() {
                return 421;
            },
            code: 'stex',
        },
    },
};

@decorators.node<OpporSta>({
    storage: 'external',
    tableName: 'OPPORSTA',
    keyPropertyNames: ['coupeId', 'stelinx'],
    indexes: [
        {
            orderBy: {
                coupeId: 1,
                stelinx: 1,
            },
            isUnique: true,
            isNaturalKey: true,
        },
    ],
    externalStorageManager: new X3StorageManager({
        joins,
        joinFallbackProperties: ['stelinx'],
    }),
    serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    isPublished: true,
    canRead: true,
    canSearch: true,
    canExport: false,
})
export class OpporSta extends Node {
    @decorators.referenceProperty<OpporSta, 'coupeId'>({
        isPublished: true,
        isStored: true,
        columnName: 'OPPNUM',
        columnType: 'string',
        node: () => adminAdminSpecifiquesSra.nodes.Coupe,
    })
    readonly coupeId: Reference<adminAdminSpecifiquesSra.nodes.Coupe>;

    @decorators.integerProperty<OpporSta, 'stelinx'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'STELINX',
    })
    readonly stelinx: Promise<integer | null>;

    @decorators.referenceProperty<OpporSta, 'stex'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'STEX',
        columnType: 'string',
        filters: {
            lookup: {
                glossaryId: 421,
            },
            control: {
                glossaryId: 421,
            },
        },
        node: () => sageX3System.nodes.MiscellaneousTable,
    })
    readonly stex: Reference<sageX3System.nodes.MiscellaneousTable | null>;

    @decorators.booleanProperty<OpporSta, 'donx'>({
        isPublished: true,
        isStored: true,
        columnName: 'DONX',
    })
    readonly donx: Promise<boolean>;

    @decorators.dateProperty<OpporSta, 'enddatx'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'ENDDATX',
        defaultValue() {
            return X3StorageManager.getDateDefaultValue(this);
        },
    })
    readonly enddatx: Promise<date | null>;

    @decorators.stringProperty<OpporSta, 'renx'>({
        isPublished: true,
        isStored: true,
        columnName: 'RENX',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly renx: Promise<string>;
}
