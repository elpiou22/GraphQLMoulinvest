import * as sageX3Purchasing from '@sage/x3-purchasing';
import { decorators, NodeExtension } from '@sage/xtrem-core';
import { Joins, X3StorageManagerExtension } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<PurchaseReceiptLineExtension> = {};

@decorators.nodeExtension<PurchaseReceiptLineExtension>({
    extends: () => sageX3Purchasing.nodes.PurchaseReceiptLine,
    externalStorageManagerExtension: new X3StorageManagerExtension({
        joins,
    }),
})
export class PurchaseReceiptLineExtension extends NodeExtension<sageX3Purchasing.nodes.PurchaseReceiptLine> {
    @decorators.stringProperty<PurchaseReceiptLineExtension, 'yxylolin'>({
        isPublished: true,
        isStored: true,
        columnName: 'YXYLOLIN',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    })
    readonly yxylolin: Promise<string>;
}

declare module '@sage/x3-purchasing/lib/nodes/purchase-receipt-line' {
    export interface PurchaseReceiptLine extends PurchaseReceiptLineExtension {}
}
