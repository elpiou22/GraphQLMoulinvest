import * as sageX3MasterData from '@sage/x3-master-data';
import { Context } from '@sage/xtrem-core';
import {
    cleanPurchaseReceiptValue,
    executePurchaseReceipt,
    formatPurchaseReceiptError,
    PurchaseReceiptCommonParameters,
    PurchaseReceiptCommonResult,
} from './purchase-receipt-common';

export interface PurchaseReceiptPrestaParameters extends PurchaseReceiptCommonParameters {
    category?: string;
}

export interface PurchaseReceiptPrestaResult extends PurchaseReceiptCommonResult {
    resolvedProductCode?: string;
}

const PRODUCT_BY_CATEGORY: Record<string, string> = {
    harvesting: 'FOR-ABATTAGE',
    forwarding: 'FOR-DEBARDAGE',
    transport: 'FOR-TRANSPORT',
};

async function resolveProductCode(context: Context, categoryValue: string | undefined, required: boolean): Promise<string> {
    const category = cleanPurchaseReceiptValue(categoryValue).toLowerCase();

    if (!category && !required) {
        return '';
    }

    const resolvedProductCode = PRODUCT_BY_CATEGORY[category];
    if (!resolvedProductCode) {
        throw new Error(
            `Categorie invalide : ${categoryValue ?? ''}. Valeurs acceptees : harvesting, forwarding, transport.`,
        );
    }

    const productExists = await context.exists(sageX3MasterData.nodes.Product, { code: resolvedProductCode });
    if (!productExists) {
        throw new Error(`Article X3 introuvable : ${resolvedProductCode}`);
    }

    return resolvedProductCode;
}

export async function purchaseReceiptPresta(
    context: Context,
    parameters: PurchaseReceiptPrestaParameters,
): Promise<PurchaseReceiptPrestaResult> {
    const existingPurchaseReceiptId = cleanPurchaseReceiptValue(parameters.existingPurchaseReceiptId);
    let resolvedProductCode = '';

    try {
        resolvedProductCode = await resolveProductCode(context, parameters.category, !existingPurchaseReceiptId);
        const result = await executePurchaseReceipt(context, parameters, {
            closePurchaseOrderLine: false,
            expectedProductCode: resolvedProductCode || undefined,
        });

        return {
            ...result,
            resolvedProductCode,
        };
    } catch (error) {
        return {
            created: 0,
            message: formatPurchaseReceiptError(error, parameters.transaction),
            purchaseReceiptId: existingPurchaseReceiptId,
            resolvedProductCode,
        };
    }
}
