import * as sageX3Purchasing from '@sage/x3-purchasing';
import { decorators, NodeExtension } from '@sage/xtrem-core';
import { Joins, X3StorageManagerExtension } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<PurchaseOrderLineExtension> = {};

@decorators.nodeExtension<PurchaseOrderLineExtension>({
    extends: () => sageX3Purchasing.nodes.PurchaseOrderLine,
    externalStorageManagerExtension: new X3StorageManagerExtension({
        joins,
    }),
})
export class PurchaseOrderLineExtension extends NodeExtension<sageX3Purchasing.nodes.PurchaseOrderLine> {
    @decorators.stringProperty<PurchaseOrderLineExtension, 'yxylolin'>({
        isPublished: true,
        isStored: true,
        columnName: 'YXYLOLIN',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    })
    readonly yxylolin: Promise<string>;
}

declare module '@sage/x3-purchasing/lib/nodes/purchase-order-line' {
    export interface PurchaseOrderLine extends PurchaseOrderLineExtension {}
}
