import { Context, decimal } from '@sage/xtrem-core';
import {
    cleanPurchaseReceiptValue,
    executePurchaseReceipt,
    formatPurchaseReceiptError,
    PurchaseReceiptCommonParameters,
    PurchaseReceiptCommonResult,
} from './purchase-receipt-common';

export interface PurchaseReceiptBlocParameters extends PurchaseReceiptCommonParameters {
    productCode?: string;
}

export interface PurchaseReceiptBlocResult extends PurchaseReceiptCommonResult {}

const DEFAULT_PRODUCT = 'PAG103';

export async function purchaseReceiptBloc(
    context: Context,
    parameters: PurchaseReceiptBlocParameters,
): Promise<PurchaseReceiptBlocResult> {
    const existingPurchaseReceiptId = cleanPurchaseReceiptValue(parameters.existingPurchaseReceiptId);

    try {
        return await executePurchaseReceipt(context, parameters, {
            closePurchaseOrderLine: true,
            expectedProductCode: cleanPurchaseReceiptValue(parameters.productCode) || DEFAULT_PRODUCT,
            defaultQuantity: 1 as decimal,
        });
    } catch (error) {
        return {
            created: 0,
            message: formatPurchaseReceiptError(error, parameters.transaction),
            purchaseReceiptId: existingPurchaseReceiptId,
        };
    }
}
