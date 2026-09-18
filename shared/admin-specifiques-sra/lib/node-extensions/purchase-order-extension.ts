import * as sageX3Purchasing from '@sage/x3-purchasing';
import { Context, DateValue, decimal, decorators, NodeExtension } from '@sage/xtrem-core';
import { Joins, X3StorageManager, X3StorageManagerExtension } from '@sage/xtrem-x3-gateway';
import * as adminAdminSpecifiquesSra from '..';

const joins: Joins<PurchaseOrderExtension> = {};

@decorators.nodeExtension<PurchaseOrderExtension>({
    extends: () => sageX3Purchasing.nodes.PurchaseOrder,
    externalStorageManagerExtension: new X3StorageManagerExtension({
        joins,
    }),
})
export class PurchaseOrderExtension extends NodeExtension<sageX3Purchasing.nodes.PurchaseOrder> {
    @decorators.mutation<typeof PurchaseOrderExtension, 'purchaseOrderBloc'>({
        /* RequestNodeName: PurchaseOrderBloc */
        isPublished: true,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
        parameters: [
            {
                name: 'parameters',
                type: 'object',
                properties: {
                    xylolinkOrderNumber: {
                        isMandatory: true,
                        type: 'string',
                    },
                    orderDate: {
                        isMandatory: true,
                        type: 'date',
                    },
                    supplierCode: {
                        isMandatory: true,
                        type: 'string',
                    },
                    cuttingId: {
                        isMandatory: true,
                        type: 'string',
                    },
                    xylolinkLineId: {
                        isMandatory: true,
                        type: 'string',
                    },
                    productCode: 'string',
                    orderUnit: {
                        isMandatory: true,
                        type: 'string',
                    },
                    quantity: 'decimal',
                    expectedReceiptDate: {
                        isMandatory: true,
                        type: 'date',
                    },
                    grossPrice: {
                        isMandatory: true,
                        type: 'decimal',
                    },
                    existingPurchaseOrderId: 'string',
                },
            },
        ],
        return: {
            type: 'object',
            properties: {
                created: 'integer',
                message: 'string',
                purchaseOrderId: 'string',
            },
        },
    })
    static purchaseOrderBloc(
        context: Context,
        parameters: {
            xylolinkOrderNumber: string;
            orderDate: DateValue;
            supplierCode: string;
            cuttingId: string;
            xylolinkLineId: string;
            productCode?: string;
            orderUnit: string;
            quantity?: decimal;
            expectedReceiptDate: DateValue;
            grossPrice: decimal;
            existingPurchaseOrderId?: string;
        },
    ): Promise<{
        created?: number;
        message?: string;
        purchaseOrderId?: string;
    }> {
        return adminAdminSpecifiquesSra.functions.purchaseOrderBloc(context, parameters);
    }

    @decorators.mutation<typeof PurchaseOrderExtension, 'purchaseOrderPresta'>({
        /* RequestNodeName: PurchaseOrderPresta */
        isPublished: true,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
        parameters: [
            {
                name: 'parameters',
                type: 'object',
                properties: {
                    existingPurchaseOrderId: 'string',
                    xylolinkOrderNumber: {
                        isMandatory: true,
                        type: 'string',
                    },
                    orderDate: {
                        isMandatory: true,
                        type: 'date',
                    },
                    supplierCode: {
                        isMandatory: true,
                        type: 'string',
                    },
                    cuttingId: {
                        isMandatory: true,
                        type: 'string',
                    },
                    xylolinkLineId: {
                        isMandatory: true,
                        type: 'string',
                    },
                    category: {
                        isMandatory: true,
                        type: 'string',
                    },
                    orderUnit: {
                        isMandatory: true,
                        type: 'string',
                    },
                    quantity: {
                        isMandatory: true,
                        type: 'decimal',
                    },
                    expectedReceiptDate: {
                        isMandatory: true,
                        type: 'date',
                    },
                    grossPrice: {
                        isMandatory: true,
                        type: 'decimal',
                    },
                },
            },
        ],
        return: {
            type: 'object',
            properties: {
                created: 'integer',
                message: 'string',
                purchaseOrderId: 'string',
                resolvedProductCode: 'string',
            },
        },
    })
    static purchaseOrderPresta(
        context: Context,
        parameters: {
            existingPurchaseOrderId?: string;
            xylolinkOrderNumber: string;
            orderDate: DateValue;
            supplierCode: string;
            cuttingId: string;
            xylolinkLineId: string;
            category: string;
            orderUnit: string;
            quantity: decimal;
            expectedReceiptDate: DateValue;
            grossPrice: decimal;
        },
    ): Promise<{
        created?: number;
        message?: string;
        purchaseOrderId?: string;
        resolvedProductCode?: string;
    }> {
        return adminAdminSpecifiquesSra.functions.purchaseOrderPresta(context, parameters);
    }

    @decorators.mutation<typeof PurchaseOrderExtension, 'purchaseOrderUp'>({
        /* RequestNodeName: PurchaseOrderUp */
        isPublished: true,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
        parameters: [
            {
                name: 'parameters',
                type: 'object',
                properties: {
                    existingPurchaseOrderId: 'string',
                    xylolinkOrderNumber: {
                        isMandatory: true,
                        type: 'string',
                    },
                    orderDate: {
                        isMandatory: true,
                        type: 'date',
                    },
                    supplierCode: {
                        isMandatory: true,
                        type: 'string',
                    },
                    cuttingId: {
                        isMandatory: true,
                        type: 'string',
                    },
                    xylolinkLineId: {
                        isMandatory: true,
                        type: 'string',
                    },
                    productCode: 'string',
                    qualityCode: 'string',
                    speciesCode: {
                        isMandatory: true,
                        type: 'string',
                    },
                    orderUnit: {
                        isMandatory: true,
                        type: 'string',
                    },
                    quantity: {
                        isMandatory: true,
                        type: 'decimal',
                    },
                    expectedReceiptDate: {
                        isMandatory: true,
                        type: 'date',
                    },
                    grossPrice: {
                        isMandatory: true,
                        type: 'decimal',
                    },
                },
            },
        ],
        return: {
            type: 'object',
            properties: {
                created: 'integer',
                message: 'string',
                purchaseOrderId: 'string',
                resolvedProductCode: 'string',
            },
        },
    })
    static purchaseOrderUp(
        context: Context,
        parameters: {
            existingPurchaseOrderId?: string;
            xylolinkOrderNumber: string;
            orderDate: DateValue;
            supplierCode: string;
            cuttingId: string;
            xylolinkLineId: string;
            productCode?: string;
            qualityCode?: string;
            speciesCode: string;
            orderUnit: string;
            quantity: decimal;
            expectedReceiptDate: DateValue;
            grossPrice: decimal;
        },
    ): Promise<{
        created?: number;
        message?: string;
        purchaseOrderId?: string;
        resolvedProductCode?: string;
    }> {
        return adminAdminSpecifiquesSra.functions.purchaseOrderUp(context, parameters);
    }
}

declare module '@sage/x3-purchasing/lib/nodes/purchase-order' {
    export interface PurchaseOrder extends PurchaseOrderExtension {}
}
