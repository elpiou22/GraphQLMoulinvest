import * as sageX3Stock from '@sage/x3-stock';
import { decorators, NodeExtension } from '@sage/xtrem-core';
import { Joins, X3StorageManagerExtension } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<MiscellaneousIssueLineExtension> = {};

@decorators.nodeExtension<MiscellaneousIssueLineExtension>({
    extends: () => sageX3Stock.nodes.MiscellaneousIssueLine,
    externalStorageManagerExtension: new X3StorageManagerExtension({
        joins,
    }),
})
export class MiscellaneousIssueLineExtension extends NodeExtension<sageX3Stock.nodes.MiscellaneousIssueLine> {
    @decorators.stringProperty<MiscellaneousIssueLineExtension, 'yxylolinent'>({
        isPublished: true,
        isStored: true,
        columnName: 'YXYLOLINENT',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    })
    readonly yxylolinent: Promise<string>;
}

declare module '@sage/x3-stock/lib/nodes/miscellaneous-issue-line' {
    export interface MiscellaneousIssueLine extends MiscellaneousIssueLineExtension {}
}
