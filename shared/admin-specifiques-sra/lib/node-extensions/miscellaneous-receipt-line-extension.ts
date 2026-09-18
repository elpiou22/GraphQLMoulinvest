import * as sageX3Stock from '@sage/x3-stock';
import { decorators, NodeExtension } from '@sage/xtrem-core';
import { Joins, X3StorageManagerExtension } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<MiscellaneousReceiptLineExtension> = {};

@decorators.nodeExtension<MiscellaneousReceiptLineExtension>({
    extends: () => sageX3Stock.nodes.MiscellaneousReceiptLine,
    externalStorageManagerExtension: new X3StorageManagerExtension({
        joins,
    }),
})
export class MiscellaneousReceiptLineExtension extends NodeExtension<sageX3Stock.nodes.MiscellaneousReceiptLine> {
    @decorators.stringProperty<MiscellaneousReceiptLineExtension, 'yxylolinent'>({
        isPublished: true,
        isStored: true,
        columnName: 'YXYLOLINENT',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    })
    readonly yxylolinent: Promise<string>;
}

declare module '@sage/x3-stock/lib/nodes/miscellaneous-receipt-line' {
    export interface MiscellaneousReceiptLine extends MiscellaneousReceiptLineExtension {}
}
