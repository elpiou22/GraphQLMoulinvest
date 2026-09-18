import * as sageX3System from '@sage/x3-system';
import { date, decorators, integer, Node, Reference } from '@sage/xtrem-core';
import { Joins, X3StorageManager } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<OpporStb> = {
    referenceJoins: {
        coupeId: {
            id: 'coupeId',
        },
        ste: {
            glossaryId() {
                return 400;
            },
            code: 'ste',
        },
    },
};

@decorators.node<OpporStb>({
    storage: 'external',
    tableName: 'OPPORSTB',
    keyPropertyNames: ['coupeId', 'stelin'],
    indexes: [
        {
            orderBy: {
                coupeId: 1,
                stelin: 1,
            },
            isUnique: true,
            isNaturalKey: true,
        },
    ],
    externalStorageManager: new X3StorageManager({
        joins,
        joinFallbackProperties: ['stelin'],
    }),
    serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    isPublished: true,
    canRead: true,
    canSearch: true,
    canExport: false,
})
export class OpporStb extends Node {
    @decorators.referenceProperty<OpporStb, 'coupeId'>({
        isPublished: true,
        isStored: true,
        columnName: 'OPPNUM',
        columnType: 'string',
        node: () => adminAdminSpecifiquesSra.nodes.Coupe,
    })
    readonly coupeId: Reference<adminAdminSpecifiquesSra.nodes.Coupe>;

    @decorators.integerProperty<OpporStb, 'stelin'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'STELIN',
    })
    readonly stelin: Promise<integer | null>;

    @decorators.referenceProperty<OpporStb, 'ste'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'STE',
        columnType: 'string',
        filters: {
            lookup: {
                glossaryId: 400,
            },
            control: {
                glossaryId: 400,
            },
        },
        node: () => sageX3System.nodes.MiscellaneousTable,
    })
    readonly ste: Reference<sageX3System.nodes.MiscellaneousTable | null>;

    @decorators.booleanProperty<OpporStb, 'don'>({
        isPublished: true,
        isStored: true,
        columnName: 'DON',
    })
    readonly don: Promise<boolean>;

    @decorators.dateProperty<OpporStb, 'enddat'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'ENDDAT',
        defaultValue() {
            return X3StorageManager.getDateDefaultValue(this);
        },
    })
    readonly enddat: Promise<date | null>;

    @decorators.stringProperty<OpporStb, 'ren'>({
        isPublished: true,
        isStored: true,
        columnName: 'REN',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly ren: Promise<string>;
}
