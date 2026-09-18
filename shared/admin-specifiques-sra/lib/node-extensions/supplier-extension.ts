import * as sageX3MasterData from '@sage/x3-master-data';
import { decorators, NodeExtension } from '@sage/xtrem-core';
import { Joins, X3StorageManagerExtension } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<SupplierExtension> = {};

@decorators.nodeExtension<SupplierExtension>({
    extends: () => sageX3MasterData.nodes.Supplier,
    externalStorageManagerExtension: new X3StorageManagerExtension({
        joins,
    }),
})
export class SupplierExtension extends NodeExtension<sageX3MasterData.nodes.Supplier> {
    @decorators.stringProperty<SupplierExtension, 'idXylolink'>({
        isPublished: true,
        isStored: true,
        columnName: 'YBPSNUMXYLO',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    })
    readonly idXylolink: Promise<string>;

    @decorators.booleanProperty<SupplierExtension, 'pefc'>({
        isPublished: true,
        isStored: true,
        columnName: 'YPEFC',
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    })
    readonly pefc: Promise<boolean>;

    @decorators.booleanProperty<SupplierExtension, 'bdf'>({
        isPublished: true,
        isStored: true,
        columnName: 'YBDF',
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    })
    readonly bdf: Promise<boolean>;
}

declare module '@sage/x3-master-data/lib/nodes/supplier' {
    export interface Supplier extends SupplierExtension {}
}
