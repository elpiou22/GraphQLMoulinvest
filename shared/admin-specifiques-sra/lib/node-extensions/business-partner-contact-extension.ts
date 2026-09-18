import * as sageX3MasterData from '@sage/x3-master-data';
import { decorators, NodeExtension } from '@sage/xtrem-core';
import { Joins, X3StorageManagerExtension } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<BusinessPartnerContactExtension> = {};

@decorators.nodeExtension<BusinessPartnerContactExtension>({
    extends: () => sageX3MasterData.nodes.BusinessPartnerContact,
    externalStorageManagerExtension: new X3StorageManagerExtension({
        joins,
    }),
})
export class BusinessPartnerContactExtension extends NodeExtension<sageX3MasterData.nodes.BusinessPartnerContact> {
    @decorators.stringProperty<BusinessPartnerContactExtension, 'idXylolink'>({
        isPublished: true,
        isStored: true,
        columnName: 'YCCNCRMXYLO',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    })
    readonly idXylolink: Promise<string>;
}

declare module '@sage/x3-master-data/lib/nodes/business-partner-contact' {
    export interface BusinessPartnerContact extends BusinessPartnerContactExtension {}
}
