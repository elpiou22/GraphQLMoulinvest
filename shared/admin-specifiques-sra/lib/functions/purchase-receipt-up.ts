import * as sageX3MasterData from '@sage/x3-master-data';
import { Context } from '@sage/xtrem-core';
import {
    cleanPurchaseReceiptValue,
    executePurchaseReceipt,
    PurchaseReceiptCommonParameters,
    PurchaseReceiptCommonResult,
} from './purchase-receipt-common';

export interface PurchaseReceiptUpParameters extends PurchaseReceiptCommonParameters {
    productCode?: string;
    qualityCode?: string;
    speciesCode?: string;
}

export interface PurchaseReceiptUpResult extends PurchaseReceiptCommonResult {
    resolvedProductCode?: string;
}

async function resolveProductCode(
    context: Context,
    parameters: PurchaseReceiptUpParameters,
    required: boolean,
): Promise<string> {
    const productCode = cleanPurchaseReceiptValue(parameters.productCode);
    const qualityCode = cleanPurchaseReceiptValue(parameters.qualityCode);
    const speciesCode = cleanPurchaseReceiptValue(parameters.speciesCode);
    const baseCode = productCode || qualityCode;

    if (!baseCode && !speciesCode && !required) {
        return '';
    }
    if (!baseCode) {
        throw new Error('productCode ou qualityCode doit etre renseigne.');
    }
    if (!speciesCode) {
        throw new Error('speciesCode doit etre renseigne.');
    }

    const resolvedProductCode = baseCode + speciesCode;
    const productExists = await context.exists(sageX3MasterData.nodes.Product, { code: resolvedProductCode });

    if (!productExists) {
        throw new Error(`Article X3 introuvable : ${resolvedProductCode}`);
    }

    return resolvedProductCode;
}

export async function purchaseReceiptUp(
    context: Context,
    parameters: PurchaseReceiptUpParameters,
): Promise<PurchaseReceiptUpResult> {
    const existingPurchaseReceiptId = cleanPurchaseReceiptValue(parameters.existingPurchaseReceiptId);
    let resolvedProductCode = '';

    try {
        resolvedProductCode = await resolveProductCode(context, parameters, !existingPurchaseReceiptId);
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
            message: error instanceof Error ? error.message : String(error),
            purchaseReceiptId: existingPurchaseReceiptId,
            resolvedProductCode,
        };
    }
}
