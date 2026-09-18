import * as sageX3MasterData from '@sage/x3-master-data';
import * as sageX3ProjectManagementData from '@sage/x3-project-management-data';
import * as sageX3Structure from '@sage/x3-structure';
import * as sageX3System from '@sage/x3-system';
import { Collection, date, decorators, integer, Node, Reference } from '@sage/xtrem-core';
import { Joins, X3StorageManager } from '@sage/xtrem-x3-gateway';
import * as sageXtremX3SystemUtils from '@sage/xtrem-x3-system-utils';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<Coupe> = {
    referenceJoins: {
        category: {
            glossaryId() {
                return 434;
            },
            code: 'category',
        },
        salesRepresentative: {
            code: 'salesRepresentative',
        },
        businessPartner: {
            code: 'businessPartner',
        },
        contact: {
            code: 'contact',
        },
        currency: {
            code: 'currency',
        },
        site: {
            code: 'site',
        },
        ypays: {
            code: 'ypays',
        },
        projectLink: {
            id: 'id',
        },
    },
    collectionJoins: {
        crmLines: {
            coupeId: 'id',
        },
        cppLines: {
            coupeId: 'id',
        },
        sbbLines: {
            coupeId: 'id',
        },
        stbLines: {
            coupeId: 'id',
        },
        staLines: {
            coupeId: 'id',
        },
    },
};

@decorators.node<Coupe>({
    storage: 'external',
    tableName: 'OPPOR',
    keyPropertyNames: ['id'],
    indexes: [
        {
            orderBy: {
                id: 1,
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
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canDeleteMany: true,
    canExport: false,
})
export class Coupe extends Node {
    @decorators.stringProperty<Coupe, 'id'>({
        isPublished: true,
        isStored: true,
        isNotEmpty: true,
        columnName: 'OPPNUM',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly id: Promise<string>;

    @decorators.referenceProperty<Coupe, 'category'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'OPPTYP',
        columnType: 'string',
        filters: {
            lookup: {
                glossaryId: 434,
            },
            control: {
                glossaryId: 434,
            },
        },
        node: () => sageX3System.nodes.MiscellaneousTable,
    })
    readonly category: Reference<sageX3System.nodes.MiscellaneousTable | null>;

    @decorators.stringProperty<Coupe, 'externalIdentifier'>({
        isPublished: true,
        isStored: true,
        columnName: 'OPPEXTNUM',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly externalIdentifier: Promise<string>;

    @decorators.booleanProperty<Coupe, 'isClosed'>({
        isPublished: true,
        isStored: true,
        columnName: 'OPPCLO',
    })
    readonly isClosed: Promise<boolean>;

    @decorators.referenceProperty<Coupe, 'salesRepresentative'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'OPPREP',
        columnType: 'string',
        node: () => sageX3MasterData.nodes.SalesRep,
    })
    readonly salesRepresentative: Reference<sageX3MasterData.nodes.SalesRep | null>;

    @decorators.enumProperty<Coupe, 'rateType'>({
        isPublished: true,
        isStored: true,
        columnName: 'CHGTYP',
        dataType: () => sageX3System.enums.exchangeRateTypeDatatype,
    })
    readonly rateType: Promise<sageX3System.enums.ExchangeRateType>;

    @decorators.referenceProperty<Coupe, 'businessPartner'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'OPPCMP',
        columnType: 'string',
        node: () => sageX3MasterData.nodes.BusinessPartner,
    })
    readonly businessPartner: Reference<sageX3MasterData.nodes.BusinessPartner | null>;

    @decorators.referenceProperty<Coupe, 'contact'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'OPPMCN',
        columnType: 'string',
        node: () => sageX3MasterData.nodes.ContactRelationship,
    })
    readonly contact: Reference<sageX3MasterData.nodes.ContactRelationship | null>;

    @decorators.referenceProperty<Coupe, 'currency'>({
        isPublished: true,
        isStored: true,
        columnName: 'CUR',
        columnType: 'string',
        node: () => sageX3MasterData.nodes.Currency,
    })
    readonly currency: Reference<sageX3MasterData.nodes.Currency>;

    @decorators.referenceProperty<Coupe, 'site'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'SALFCY',
        columnType: 'string',
        node: () => sageX3System.nodes.Site,
    })
    readonly site: Reference<sageX3System.nodes.Site | null>;

    @decorators.stringProperty<Coupe, 'marketingCampaign'>({
        isPublished: true,
        isStored: true,
        columnName: 'OPPCMGNUM',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly marketingCampaign: Promise<string>;

    @decorators.stringProperty<Coupe, 'marketingOperation'>({
        isPublished: true,
        isStored: true,
        columnName: 'OPPOPGNUM',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly marketingOperation: Promise<string>;

    @decorators.stringProperty<Coupe, 'marketingOperationType'>({
        isPublished: true,
        isStored: true,
        columnName: 'OPPOPGTYP',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly marketingOperationType: Promise<string>;

    @decorators.stringProperty<Coupe, 'originalDocument'>({
        isPublished: true,
        isStored: true,
        columnName: 'OPPORIVCR',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly originalDocument: Promise<string>;

    @decorators.integerProperty<Coupe, 'originalDocumentLine'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'OPPORIVCRL',
    })
    readonly originalDocumentLine: Promise<integer | null>;

    @decorators.stringProperty<Coupe, 'creationTime'>({
        isPublished: true,
        isStored: true,
        columnName: 'CREHOU',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly creationTime: Promise<string>;

    @decorators.dateProperty<Coupe, 'openingDate'>({
        isPublished: true,
        isStored: true,
        columnName: 'OPPDATOPN',
        defaultValue() {
            return X3StorageManager.getDateDefaultValue(this);
        },
    })
    readonly openingDate: Promise<date>;

    @decorators.dateProperty<Coupe, 'yoppdatend'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'YOPPDATEND',
        defaultValue() {
            return X3StorageManager.getDateDefaultValue(this);
        },
    })
    readonly yoppdatend: Promise<date | null>;

    @decorators.stringProperty<Coupe, 'yadresse'>({
        isPublished: true,
        isStored: true,
        columnName: 'YADRESSE',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly yadresse: Promise<string>;

    @decorators.referenceProperty<Coupe, 'ypays'>({
        isPublished: true,
        isStored: true,
        isNullable: true,
        columnName: 'YPAYS',
        columnType: 'string',
        node: () => sageX3Structure.nodes.Country,
    })
    readonly ypays: Reference<sageX3Structure.nodes.Country | null>;

    @decorators.stringProperty<Coupe, 'ycity'>({
        isPublished: true,
        isStored: true,
        columnName: 'YCITY',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly ycity: Promise<string>;

    @decorators.stringProperty<Coupe, 'ypostal'>({
        isPublished: true,
        isStored: true,
        columnName: 'YPOSTAL',
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly ypostal: Promise<string>;

    @decorators.referenceProperty<Coupe, 'projectLink'>({
        isPublished: true,
        isStored: true,
        columnType: 'string',
        node: () => sageX3ProjectManagementData.nodes.ProjectLink,
        isMutable: true,
    })
    readonly projectLink: Reference<sageX3ProjectManagementData.nodes.ProjectLink>;

    @decorators.collectionProperty<Coupe, 'crmLines'>({
        isPublished: true,
        node: () => adminAdminSpecifiquesSra.nodes.OpporCrm,
        isMutable: true,
        dependsOn: ['id'],
    })
    readonly crmLines: Collection<adminAdminSpecifiquesSra.nodes.OpporCrm>;

    @decorators.collectionProperty<Coupe, 'cppLines'>({
        isPublished: true,
        node: () => adminAdminSpecifiquesSra.nodes.OpporCpp,
        isMutable: true,
        dependsOn: ['id'],
    })
    readonly cppLines: Collection<adminAdminSpecifiquesSra.nodes.OpporCpp>;

    @decorators.collectionProperty<Coupe, 'sbbLines'>({
        isPublished: true,
        node: () => adminAdminSpecifiquesSra.nodes.OpporSbb,
        isMutable: true,
        dependsOn: ['id'],
    })
    readonly sbbLines: Collection<adminAdminSpecifiquesSra.nodes.OpporSbb>;

    @decorators.collectionProperty<Coupe, 'stbLines'>({
        isPublished: true,
        node: () => adminAdminSpecifiquesSra.nodes.OpporStb,
        isMutable: true,
        dependsOn: ['id'],
    })
    readonly stbLines: Collection<adminAdminSpecifiquesSra.nodes.OpporStb>;

    @decorators.collectionProperty<Coupe, 'staLines'>({
        isPublished: true,
        node: () => adminAdminSpecifiquesSra.nodes.OpporSta,
        isMutable: true,
        dependsOn: ['id'],
    })
    readonly staLines: Collection<adminAdminSpecifiquesSra.nodes.OpporSta>;

    @decorators.stringProperty<Coupe, 'name'>({
        isPublished: true,
        isTransientInput: true,
        dataType: () => sageXtremX3SystemUtils.datatypes.genericDataTypes.textDatatype,
    })
    readonly name: Promise<string>;
}
