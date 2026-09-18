import { decorators, Node, Reference } from '@sage/xtrem-core';
import { Joins, X3StorageManager } from '@sage/xtrem-x3-gateway';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<OpporSbb> = {
    referenceJoins: {
        coupeId: {
            id: 'coupeId',
        },
        sbbProject: {
            id: 'sbbProject',
        },
    },
};

@decorators.node<OpporSbb>({
    storage: 'external',
    tableName: 'OPPORSBB',
    keyPropertyNames: ['coupeId', 'sbbProject'],
    indexes: [
        {
            orderBy: {
                coupeId: 1,
                sbbProject: 1,
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
export class OpporSbb extends Node {
    @decorators.referenceProperty<OpporSbb, 'coupeId'>({
        isPublished: true,
        isStored: true,
        columnName: 'OPPNUM',
        columnType: 'string',
        node: () => adminAdminSpecifiquesSra.nodes.Coupe,
    })
    readonly coupeId: Reference<adminAdminSpecifiquesSra.nodes.Coupe>;

    @decorators.referenceProperty<OpporSbb, 'sbbProject'>({
        isPublished: true,
        isStored: true,
        columnName: 'SBBPJT',
        columnType: 'string',
        node: () => adminAdminSpecifiquesSra.nodes.Coupe,
    })
    readonly sbbProject: Reference<adminAdminSpecifiquesSra.nodes.Coupe>;
}
