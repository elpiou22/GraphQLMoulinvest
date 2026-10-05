import * as sageX3MasterData from '@sage/x3-master-data';
import { Context, NodeQueryFilter } from '@sage/xtrem-core';
import {
    cleanPurchaseReceiptValue,
    executePurchaseReceipt,
    formatPurchaseReceiptError,
    PurchaseReceiptCommonParameters,
    PurchaseReceiptCommonResult,
} from './purchase-receipt-common';

export interface PurchaseReceiptUpParameters extends PurchaseReceiptCommonParameters {
    productCategory?: string;
    specyCode?: string;
    lengthCode?: string;
    qualityCode?: string;
    dimensionCode?: string;
}

export interface PurchaseReceiptUpResult extends PurchaseReceiptCommonResult {
    resolvedProductCode?: string;
}

async function resolveProductCode(
    context: Context,
    parameters: PurchaseReceiptUpParameters,
    required: boolean,
): Promise<string> {
    const productCategory = cleanPurchaseReceiptValue(parameters.productCategory);
    const specyCode = cleanPurchaseReceiptValue(parameters.specyCode);
    const lengthCode = cleanPurchaseReceiptValue(parameters.lengthCode);
    const qualityCode = cleanPurchaseReceiptValue(parameters.qualityCode);
    const dimensionCode = cleanPurchaseReceiptValue(parameters.dimensionCode);

    if (!productCategory && !specyCode && !lengthCode && !qualityCode && !dimensionCode && !required) {
        return '';
    }
    if (!productCategory || !specyCode || !lengthCode || !qualityCode || !dimensionCode) {
        throw new Error(
            'productCategory, les familles statistiques 1, 2, 3 et la dimension doivent etre renseignees.',
        );
    }

    const filter: NodeQueryFilter<sageX3MasterData.nodes.Product> = {
        _and: [
            { productCategory },
            {
                statisticalGroups: {
                    _atLeast: 1,
                    denormalizedIndex: 1,
                    statisticalGroup: specyCode,
                },
            },
            {
                statisticalGroups: {
                    _atLeast: 1,
                    denormalizedIndex: 2,
                    statisticalGroup: lengthCode,
                },
            },
            {
                statisticalGroups: {
                    _atLeast: 1,
                    denormalizedIndex: 3,
                    statisticalGroup: qualityCode,
                },
            },
            {
                statisticalGroupsSpe: {
                    _atLeast: 1,
                    denormalizedIndex: 1,
                    statisticalGroupSpe: dimensionCode,
                },
            },
        ],
    };

    const matchCount = await context.queryCount(sageX3MasterData.nodes.Product, { filter });

    if (matchCount === 0) {
        throw new Error('Aucun article X3 ne correspond aux familles statistiques renseignees.');
    }
    if (matchCount > 1) {
        throw new Error(`Plusieurs articles X3 correspondent aux familles statistiques : ${matchCount}.`);
    }

    const products = await context
        .query(sageX3MasterData.nodes.Product, {
            filter,
            first: 1,
        })
        .toArray();
    const product = products[0];

    if (!product) {
        throw new Error('Article X3 introuvable apres recherche par familles statistiques.');
    }

    return await product.code;
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
            message: formatPurchaseReceiptError(error, parameters.transaction),
            purchaseReceiptId: existingPurchaseReceiptId,
            resolvedProductCode,
        };
    }
}
