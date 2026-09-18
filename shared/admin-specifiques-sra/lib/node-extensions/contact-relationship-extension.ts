import * as sageX3MasterData from '@sage/x3-master-data';
import { decorators, NodeExtension } from '@sage/xtrem-core';
import { Joins, X3StorageManagerExtension } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<ContactRelationshipExtension> = {};

@decorators.nodeExtension<ContactRelationshipExtension>({
    extends: () => sageX3MasterData.nodes.ContactRelationship,
    externalStorageManagerExtension: new X3StorageManagerExtension({
        joins,
    }),
})
export class ContactRelationshipExtension extends NodeExtension<sageX3MasterData.nodes.ContactRelationship> {
    @decorators.stringProperty<ContactRelationshipExtension, 'idXylolink'>({
        isPublished: true,
        isStored: true,
        columnName: 'YCCNCRMXYLO',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
    })
    readonly idXylolink: Promise<string>;
}

declare module '@sage/x3-master-data/lib/nodes/contact-relationship' {
    export interface ContactRelationship extends ContactRelationshipExtension {}
}
