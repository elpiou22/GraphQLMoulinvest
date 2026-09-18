import { date, decimal, decorators, integer, Node, Reference } from '@sage/xtrem-core';
import { Joins, X3StorageManager } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<OpporCrm> = {
    referenceJoins: {
        coupeId: {
            id: 'coupeId',
        },
    },
};

@decorators.node<OpporCrm>({
    storage: 'external',
    tableName: 'OPPORCRM',
    keyPropertyNames: ['coupeId'],
    indexes: [
        {
            orderBy: {
                coupeId: 1,
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
export class OpporCrm extends Node {
    @decorators.referenceProperty<OpporCrm, 'coupeId'>({
        isPublished: true,
        isStored: true,
        columnName: 'OPPNUM',
        columnType: 'string',
        node: () => adminAdminSpecifiquesSra.nodes.Coupe,
    })
    readonly coupeId: Reference<adminAdminSpecifiquesSra.nodes.Coupe>;

    @decorators.decimalProperty<OpporCrm, 'oppamt'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'OPPAMT',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.decimalDatatype,
    })
    readonly oppamt: Promise<decimal | null>;

    @decorators.integerProperty<OpporCrm, 'pbyprj'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'PBYPRJ',
    })
    readonly pbyprj: Promise<integer | null>;

    @decorators.integerProperty<OpporCrm, 'oppsuc'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'OPPSUC',
    })
    readonly oppsuc: Promise<integer | null>;

    @decorators.booleanProperty<OpporCrm, 'damave'>({
        isPublished: true,
        isStored: true,
        columnName: 'DAMAVE',
    })
    readonly damave: Promise<boolean>;

    @decorators.booleanProperty<OpporCrm, 'damcum'>({
        isPublished: true,
        isStored: true,
        columnName: 'DAMCUM',
    })
    readonly damcum: Promise<boolean>;

    @decorators.dateProperty<OpporCrm, 'oppcda'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'OPPCDA',
        defaultValue() {
            return X3StorageManager.getDateDefaultValue(this);
        },
    })
    readonly oppcda: Promise<date | null>;
}
