import * as sageX3Purchasing from '@sage/x3-purchasing';
import { Context, DateValue, decimal } from '@sage/xtrem-core';

export interface PurchaseReceiptCommonParameters {
    existingPurchaseReceiptId?: string;
    receiptDate?: DateValue;
    supplierCode?: string;
    supplierPackingSlip?: string;
    purchaseOrderId?: string;
    xylolinkLineId?: string;
    receiptUnit?: string;
    quantity?: decimal;
}

export interface PurchaseReceiptCommonResult {
    created?: number;
    message?: string;
    purchaseReceiptId?: string;
}

interface ExecutePurchaseReceiptOptions {
    closePurchaseOrderLine: boolean;
    expectedProductCode?: string;
    defaultQuantity?: decimal;
}

const COMPANY = '02';
const RECEIPT_SITE = '0201';
const CURRENCY = 'EUR';
const BALANCE_NO = '1';
const BALANCE_YES = '2';

export function cleanPurchaseReceiptValue(value?: string): string {
    return value?.trim() ?? '';
}

function requiredString(value: string | undefined, name: string): string {
    const result = cleanPurchaseReceiptValue(value);
    if (!result) {
        throw new Error(`Parametre obligatoire pour la creation : ${name}`);
    }
    return result;
}

function requiredValue<T>(value: T | undefined, name: string): T {
    if (value === undefined || value === null) {
        throw new Error(`Parametre obligatoire pour la creation : ${name}`);
    }
    return value;
}

async function findPurchaseOrderLine(
    context: Context,
    purchaseOrderId: string,
    xylolinkLineId: string,
): Promise<sageX3Purchasing.nodes.PurchaseOrderLine> {
    const purchaseOrder = await context.tryRead(sageX3Purchasing.nodes.PurchaseOrder, {
        id: purchaseOrderId,
    });

    if (!purchaseOrder) {
        throw new Error(`Commande d'achat introuvable : ${purchaseOrderId}`);
    }

    const purchaseOrderLine = await purchaseOrder.purchaseOrderLines.takeOne(
        async line => cleanPurchaseReceiptValue(await line.$.getValue<string>('yxylolin')) === xylolinkLineId,
    );

    if (!purchaseOrderLine) {
        throw new Error(`Ligne Xylolink introuvable dans la commande ${purchaseOrderId} : ${xylolinkLineId}`);
    }

    return purchaseOrderLine;
}

async function getPurchaseOrderLineData(
    purchaseOrderLine: sageX3Purchasing.nodes.PurchaseOrderLine,
    expectedProductCode?: string,
): Promise<{ lineNumber: number; sequenceNumber: number; productCode: string }> {
    const lineNumber = await purchaseOrderLine.lineNumber;
    const sequenceNumber = await purchaseOrderLine.sequenceNumber;
    const product = await purchaseOrderLine.product;
    const productCode = product ? await product.code : '';

    if (lineNumber === null || lineNumber === undefined) {
        throw new Error("Numero de ligne de commande d'achat introuvable.");
    }
    if (sequenceNumber === null || sequenceNumber === undefined) {
        throw new Error("Sequence de ligne de commande d'achat introuvable.");
    }
    if (!productCode) {
        throw new Error("Article de la ligne de commande d'achat introuvable.");
    }
    if (expectedProductCode && productCode !== expectedProductCode) {
        throw new Error(
            `Article incoherent pour la ligne ${lineNumber} : commande=${productCode}, attendu=${expectedProductCode}.`,
        );
    }

    return {
        lineNumber: Number(lineNumber),
        sequenceNumber: Number(sequenceNumber),
        productCode,
    };
}

function buildReceiptLine(
    parameters: PurchaseReceiptCommonParameters,
    options: ExecutePurchaseReceiptOptions,
    purchaseOrderId: string,
    lineNumber: number,
    sequenceNumber: number,
    productCode: string,
): Record<string, any> {
    const receiptDate = requiredValue(parameters.receiptDate, 'receiptDate');
    const supplierCode = requiredString(parameters.supplierCode, 'supplierCode');
    const xylolinkLineId = requiredString(parameters.xylolinkLineId, 'xylolinkLineId');
    const receiptUnit = requiredString(parameters.receiptUnit, 'receiptUnit');
    const quantity = parameters.quantity ?? options.defaultQuantity;

    if (quantity === undefined || quantity === null) {
        throw new Error('Parametre obligatoire pour la creation : quantity');
    }

    return {
        company: COMPANY,
        receiptSite: RECEIPT_SITE,
        receiptDate,
        purchaseSite: RECEIPT_SITE,
        purchaseOrder: purchaseOrderId,
        purchaseOrderLine: lineNumber,
        purchaseOrderSequence: sequenceNumber,
        supplier: supplierCode,
        yxylolin: xylolinkLineId,
        product: productCode,
        receiptUnit,
        purchaseUnit: receiptUnit,
        stockUnit: receiptUnit,
        receiptUnitToPurchaseUnitConversionFactor: 1,
        receiptUnitToStockUnitConversionFactor: 1,
        quantityInReceiptUnitReceived: quantity,
        quantityInPurchaseUnitReceived: quantity,
        quantityInStockUnitReceived: quantity,
        balance: options.closePurchaseOrderLine ? BALANCE_YES : BALANCE_NO,
    };
}

function buildHeaderUpdate(parameters: PurchaseReceiptCommonParameters): Record<string, any> {
    const data: Record<string, any> = { _x3Transaction: 'ALL' };
    const supplierCode = cleanPurchaseReceiptValue(parameters.supplierCode);
    const supplierPackingSlip = cleanPurchaseReceiptValue(parameters.supplierPackingSlip);

    if (parameters.receiptDate !== undefined) data.receiptDate = parameters.receiptDate;
    if (supplierCode) data.supplier = supplierCode;
    if (supplierPackingSlip) data.supplierPackingSlip = supplierPackingSlip;

    return data;
}

function buildExistingLineUpdate(
    parameters: PurchaseReceiptCommonParameters,
    closePurchaseOrderLine: boolean,
): Record<string, any> {
    const data: Record<string, any> = {
        balance: closePurchaseOrderLine ? BALANCE_YES : BALANCE_NO,
    };
    const supplierCode = cleanPurchaseReceiptValue(parameters.supplierCode);
    const receiptUnit = cleanPurchaseReceiptValue(parameters.receiptUnit);

    if (parameters.receiptDate !== undefined) data.receiptDate = parameters.receiptDate;
    if (supplierCode) data.supplier = supplierCode;
    if (receiptUnit) {
        data.receiptUnit = receiptUnit;
        data.purchaseUnit = receiptUnit;
        data.stockUnit = receiptUnit;
    }
    if (parameters.quantity !== undefined) {
        data.quantityInReceiptUnitReceived = parameters.quantity;
        data.quantityInPurchaseUnitReceived = parameters.quantity;
        data.quantityInStockUnitReceived = parameters.quantity;
    }

    return data;
}

export async function executePurchaseReceipt(
    context: Context,
    parameters: PurchaseReceiptCommonParameters,
    options: ExecutePurchaseReceiptOptions,
): Promise<PurchaseReceiptCommonResult> {
    const existingPurchaseReceiptId = cleanPurchaseReceiptValue(parameters.existingPurchaseReceiptId);
    const purchaseOrderId = cleanPurchaseReceiptValue(parameters.purchaseOrderId);
    const xylolinkLineId = cleanPurchaseReceiptValue(parameters.xylolinkLineId);

    if (existingPurchaseReceiptId) {
        const purchaseReceipt = await context.tryRead(
            sageX3Purchasing.nodes.PurchaseReceipt,
            { id: existingPurchaseReceiptId },
            { forUpdate: true },
        );

        if (!purchaseReceipt) {
            throw new Error(`Reception d'achat introuvable : ${existingPurchaseReceiptId}`);
        }

        const headerData = buildHeaderUpdate(parameters);
        let existingLine: sageX3Purchasing.nodes.PurchaseReceiptLine | null = null;

        if (xylolinkLineId) {
            existingLine = await purchaseReceipt.lines.takeOne(
                async line => cleanPurchaseReceiptValue(await line.$.getValue<string>('yxylolin')) === xylolinkLineId,
            );
        }

        if (existingLine) {
            if (options.expectedProductCode) {
                const existingProduct = await existingLine.product;
                const existingProductCode = existingProduct ? await existingProduct.code : '';
                if (existingProductCode !== options.expectedProductCode) {
                    throw new Error(
                        `Article incoherent dans la reception : reception=${existingProductCode}, attendu=${options.expectedProductCode}.`,
                    );
                }
            }

            headerData.lines = [
                {
                    _action: 'update',
                    _id: await existingLine._id,
                    ...buildExistingLineUpdate(parameters, options.closePurchaseOrderLine),
                },
            ];
        } else if (xylolinkLineId) {
            const requiredPurchaseOrderId = requiredString(parameters.purchaseOrderId, 'purchaseOrderId');
            const purchaseOrderLine = await findPurchaseOrderLine(context, requiredPurchaseOrderId, xylolinkLineId);
            const line = await getPurchaseOrderLineData(purchaseOrderLine, options.expectedProductCode);

            headerData.lines = [
                {
                    _action: 'create',
                    ...buildReceiptLine(
                        parameters,
                        options,
                        requiredPurchaseOrderId,
                        line.lineNumber,
                        line.sequenceNumber,
                        line.productCode,
                    ),
                },
            ];
        }

        await purchaseReceipt.$.set(headerData as any);
        await purchaseReceipt.$.save();

        return {
            created: 0,
            message: existingLine
                ? `Reception d'achat ${existingPurchaseReceiptId} modifiee avec succes.`
                : xylolinkLineId
                  ? `Nouvelle ligne ajoutee a la reception ${existingPurchaseReceiptId}.`
                  : `Reception d'achat ${existingPurchaseReceiptId} modifiee avec succes.`,
            purchaseReceiptId: existingPurchaseReceiptId,
        };
    }

    const receiptDate = requiredValue(parameters.receiptDate, 'receiptDate');
    const supplierCode = requiredString(parameters.supplierCode, 'supplierCode');
    const supplierPackingSlip = requiredString(parameters.supplierPackingSlip, 'supplierPackingSlip');
    const requiredPurchaseOrderId = requiredString(parameters.purchaseOrderId, 'purchaseOrderId');
    const requiredXylolinkLineId = requiredString(parameters.xylolinkLineId, 'xylolinkLineId');
    const purchaseOrderLine = await findPurchaseOrderLine(context, requiredPurchaseOrderId, requiredXylolinkLineId);
    const line = await getPurchaseOrderLineData(purchaseOrderLine, options.expectedProductCode);
    const lineData = buildReceiptLine(
        parameters,
        options,
        requiredPurchaseOrderId,
        line.lineNumber,
        line.sequenceNumber,
        line.productCode,
    );

    const purchaseReceipt = await context.create(sageX3Purchasing.nodes.PurchaseReceipt, {
        _x3Transaction: 'ALL',
        company: COMPANY,
        receiptSite: RECEIPT_SITE,
        receiptDate,
        supplierPackingSlip,
        supplier: supplierCode,
        currency: CURRENCY,
        lines: [lineData],
    } as any);

    await purchaseReceipt.$.save();
    const purchaseReceiptId = await purchaseReceipt.id;

    return {
        created: 1,
        message: `Reception d'achat ${purchaseReceiptId} creee avec succes.`,
        purchaseReceiptId,
    };
}
