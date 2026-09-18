import * as sageX3System from '@sage/x3-system';
import { decimal, decorators, Node, Reference } from '@sage/xtrem-core';
import { Joins, X3StorageManager } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<OpporCpp> = {
    referenceJoins: {
        coupeId: {
            id: 'coupeId',
        },
        cppCode: {
            glossaryId() {
                return 418;
            },
            code: 'cppCode',
        },
    },
};

@decorators.node<OpporCpp>({
    storage: 'external',
    tableName: 'OPPORCPP',
    keyPropertyNames: ['coupeId', 'cppCode'],
    indexes: [
        {
            orderBy: {
                coupeId: 1,
                cppCode: 1,
            },
            isUnique: true,
            isNaturalKey: true,
        },
    ],
    externalStorageManager: new X3StorageManager({
        joins,
    }),
    serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    isPublished: true,
    canRead: true,
    canSearch: true,
    canExport: false,
})
export class OpporCpp extends Node {
    @decorators.referenceProperty<OpporCpp, 'coupeId'>({
        isPublished: true,
        isStored: true,
        columnName: 'OPPNUM',
        columnType: 'string',
        node: () => adminAdminSpecifiquesSra.nodes.Coupe,
    })
    readonly coupeId: Reference<adminAdminSpecifiquesSra.nodes.Coupe>;

    @decorators.referenceProperty<OpporCpp, 'cppCode'>({
        isPublished: true,
        isStored: true,
        columnName: 'CPP',
        columnType: 'string',
        filters: {
            lookup: {
                glossaryId: 418,
            },
            control: {
                glossaryId: 418,
            },
        },
        node: () => sageX3System.nodes.MiscellaneousTable,
    })
    readonly cppCode: Reference<sageX3System.nodes.MiscellaneousTable>;

    @decorators.decimalProperty<OpporCpp, 'cppAmont'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'CPPAMT',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.decimalDatatype,
    })
    readonly cppAmont: Promise<decimal | null>;

    @decorators.stringProperty<OpporCpp, 'ase'>({
        isPublished: true,
        isStored: true,
        columnName: 'ASE',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly ase: Promise<string>;

    @decorators.stringProperty<OpporCpp, 'shc'>({
        isPublished: true,
        isStored: true,
        columnName: 'SHC',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly shc: Promise<string>;
}
