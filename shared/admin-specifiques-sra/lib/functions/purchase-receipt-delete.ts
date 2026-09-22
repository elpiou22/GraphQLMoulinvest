import * as sageX3Purchasing from '@sage/x3-purchasing';
import { Context } from '@sage/xtrem-core';

export interface PurchaseReceiptDeleteParameters {
    purchaseReceiptId: string;
    transaction: string;
}

export interface PurchaseReceiptDeleteResult {
    deleted?: number;
    message?: string;
    purchaseReceiptId?: string;
}

export async function purchaseReceiptDelete(
    context: Context,
    parameters: PurchaseReceiptDeleteParameters,
): Promise<PurchaseReceiptDeleteResult> {
    const purchaseReceiptId = parameters.purchaseReceiptId?.trim() ?? '';
    const transaction = parameters.transaction?.trim() ?? '';

    if (!purchaseReceiptId) {
        return { deleted: 0, message: 'Parametre obligatoire : purchaseReceiptId' };
    }
    if (!transaction) {
        return {
            deleted: 0,
            message: 'Parametre obligatoire : transaction',
            purchaseReceiptId,
        };
    }

    try {
        const purchaseReceipt = await context.tryRead(
            sageX3Purchasing.nodes.PurchaseReceipt,
            { id: purchaseReceiptId },
            { forUpdate: true },
        );

        if (!purchaseReceipt) {
            return {
                deleted: 0,
                message: `Reception d'achat introuvable : ${purchaseReceiptId}`,
                purchaseReceiptId,
            };
        }

        // The transaction is transient and is serialized with the delete payload.
        await purchaseReceipt.$.set({ _x3Transaction: transaction } as any);
        await purchaseReceipt.$.delete();

        return {
            deleted: 1,
            message: `Reception d'achat ${purchaseReceiptId} supprimee avec succes.`,
            purchaseReceiptId,
        };
    } catch (error) {
        return {
            deleted: 0,
            message: error instanceof Error ? error.message : String(error),
            purchaseReceiptId,
        };
    }
}
