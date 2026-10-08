import * as sageX3Purchasing from '@sage/x3-purchasing';
import { Context, DateValue, decimal, decorators, NodeExtension } from '@sage/xtrem-core';
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

    @decorators.mutation<typeof PurchaseReceiptExtension, 'purchaseReceiptBloc'>({
        /* RequestNodeName: PurchaseReceiptBloc */
        isPublished: true,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
        parameters: [{
            name: 'parameters', type: 'object', properties: {
                transaction: { isMandatory: true, type: 'string' },
                existingPurchaseReceiptId: 'string', receiptDate: 'date', supplierCode: 'string',
                supplierPackingSlip: 'string', purchaseOrderId: 'string', xylolinkLineId: 'string',
                productCode: 'string', receiptUnit: 'string', quantity: 'decimal', pefcValue: 'string',
            },
        }],
        return: { type: 'object', properties: {
            created: 'integer', message: 'string', purchaseReceiptId: 'string',
        } },
    })
    static purchaseReceiptBloc(
        context: Context,
        parameters: {
            transaction: string;
            existingPurchaseReceiptId?: string;
            receiptDate?: DateValue;
            supplierCode?: string;
            supplierPackingSlip?: string;
            purchaseOrderId?: string;
            xylolinkLineId?: string;
            productCode?: string;
            receiptUnit?: string;
            quantity?: decimal;
            pefcValue?: string;
        },
    ): Promise<{ created?: number; message?: string; purchaseReceiptId?: string }> {
        return adminAdminSpecifiquesSra.functions.purchaseReceiptBloc(context, parameters);
    }

    @decorators.mutation<typeof PurchaseReceiptExtension, 'purchaseReceiptPresta'>({
        /* RequestNodeName: PurchaseReceiptPresta */
        isPublished: true,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
        parameters: [{
            name: 'parameters', type: 'object', properties: {
                transaction: { isMandatory: true, type: 'string' },
                existingPurchaseReceiptId: 'string', receiptDate: 'date', supplierCode: 'string',
                supplierPackingSlip: 'string', purchaseOrderId: 'string', xylolinkLineId: 'string',
                category: 'string', receiptUnit: 'string', quantity: 'decimal', pefcValue: 'string',
            },
        }],
        return: { type: 'object', properties: {
            created: 'integer', message: 'string', purchaseReceiptId: 'string', resolvedProductCode: 'string',
        } },
    })
    static purchaseReceiptPresta(
        context: Context,
        parameters: {
            transaction: string;
            existingPurchaseReceiptId?: string;
            receiptDate?: DateValue;
            supplierCode?: string;
            supplierPackingSlip?: string;
            purchaseOrderId?: string;
            xylolinkLineId?: string;
            category?: string;
            receiptUnit?: string;
            quantity?: decimal;
            pefcValue?: string;
        },
    ): Promise<{
        created?: number;
        message?: string;
        purchaseReceiptId?: string;
        resolvedProductCode?: string;
    }> {
        return adminAdminSpecifiquesSra.functions.purchaseReceiptPresta(context, parameters);
    }

    @decorators.mutation<typeof PurchaseReceiptExtension, 'purchaseReceiptUp'>({
        /* RequestNodeName: PurchaseReceiptUp */
        isPublished: true,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
        parameters: [{
            name: 'parameters', type: 'object', properties: {
                transaction: { isMandatory: true, type: 'string' },
                existingPurchaseReceiptId: 'string', receiptDate: 'date', supplierCode: 'string',
                supplierPackingSlip: 'string', purchaseOrderId: 'string', xylolinkLineId: 'string',
                productCategory: 'string', specyCode: 'string', lengthCode: 'string', qualityCode: 'string',
                dimensionCode: 'string', receiptUnit: 'string', quantity: 'decimal', pefcValue: 'string',
            },
        }],
        return: { type: 'object', properties: {
            created: 'integer', message: 'string', purchaseReceiptId: 'string', resolvedProductCode: 'string',
        } },
    })
    static purchaseReceiptUp(
        context: Context,
        parameters: {
            transaction: string;
            existingPurchaseReceiptId?: string;
            receiptDate?: DateValue;
            supplierCode?: string;
            supplierPackingSlip?: string;
            purchaseOrderId?: string;
            xylolinkLineId?: string;
            productCategory?: string;
            specyCode?: string;
            lengthCode?: string;
            qualityCode?: string;
            dimensionCode?: string;
            receiptUnit?: string;
            quantity?: decimal;
            pefcValue?: string;
        },
    ): Promise<{
        created?: number;
        message?: string;
        purchaseReceiptId?: string;
        resolvedProductCode?: string;
    }> {
        return adminAdminSpecifiquesSra.functions.purchaseReceiptUp(context, parameters);
    }

    @decorators.mutation<typeof PurchaseReceiptExtension, 'purchaseReceiptDelete'>({
        /* RequestNodeName: PurchaseReceiptDelete */
        isPublished: true,
        serviceOptions: () => [adminAdminSpecifiquesSra.serviceOptions.YsraActivityCode],
        parameters: [{
            name: 'parameters', type: 'object', properties: {
                transaction: { isMandatory: true, type: 'string' },
                purchaseReceiptId: { isMandatory: true, type: 'string' },
            },
        }],
        return: { type: 'object', properties: {
            deleted: 'integer', message: 'string', purchaseReceiptId: 'string',
        } },
    })
    static purchaseReceiptDelete(
        context: Context,
        parameters: { transaction: string; purchaseReceiptId: string },
    ): Promise<{ deleted?: number; message?: string; purchaseReceiptId: string }> {
        return adminAdminSpecifiquesSra.functions.purchaseReceiptDelete(context, parameters);
    }
}

declare module '@sage/x3-purchasing/lib/nodes/purchase-receipt' {
    export interface PurchaseReceipt extends PurchaseReceiptExtension {}
}
