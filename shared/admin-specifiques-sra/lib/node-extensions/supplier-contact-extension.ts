import * as sageX3MasterData from '@sage/x3-master-data';
import { decorators, NodeExtension } from '@sage/xtrem-core';
import { Joins, X3StorageManagerExtension } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<SupplierContactExtension> = {};

@decorators.nodeExtension<SupplierContactExtension>({
    extends: () => sageX3MasterData.nodes.SupplierContact,
    externalStorageManagerExtension: new X3StorageManagerExtension({
        joins,
    }),
})
export class SupplierContactExtension extends NodeExtension<sageX3MasterData.nodes.SupplierContact> {
    @decorators.stringProperty<SupplierContactExtension, 'idXylolink'>({
        isPublished: true,
        isStored: true,
        columnName: 'YCCNCRMXYLO',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    })
    readonly idXylolink: Promise<string>;
}

declare module '@sage/x3-master-data/lib/nodes/supplier-contact' {
    export interface SupplierContact extends SupplierContactExtension {}
}
