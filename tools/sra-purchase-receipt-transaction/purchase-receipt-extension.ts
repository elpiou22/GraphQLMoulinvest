import * as sageX3Purchasing from '@sage/x3-purchasing';
import { decorators, NodeExtension } from '@sage/xtrem-core';
import { Joins, X3StorageManagerExtension } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<PurchaseReceiptExtension> = {};

@decorators.nodeExtension<PurchaseReceiptExtension>({
    extends: () => sageX3Purchasing.nodes.PurchaseReceipt,
    externalStorageManagerExtension: new X3StorageManagerExtension({
        joins,
    }),
})
export class PurchaseReceiptExtension extends NodeExtension<sageX3Purchasing.nodes.PurchaseReceipt> {
    @decorators.stringProperty<PurchaseReceiptExtension, '_x3Transaction'>({
        isPublished: true,
        isTransientInput: true,
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    })
    readonly _x3Transaction: Promise<string>;
}

declare module '@sage/x3-purchasing/lib/nodes/purchase-receipt' {
    export interface PurchaseReceipt extends PurchaseReceiptExtension {}
}
