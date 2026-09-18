import * as sageX3Purchasing from '@sage/x3-purchasing';
import { Context, DateValue, decimal } from '@sage/xtrem-core';

export interface PurchaseOrderBlocParameters {
    existingPurchaseOrderId?: string;
    xylolinkOrderNumber?: string;
    orderDate?: DateValue;
    supplierCode?: string;
    cuttingId?: string;
    xylolinkLineId?: string;
    productCode?: string;
    orderUnit?: string;
    quantity?: decimal;
    expectedReceiptDate?: DateValue;
    grossPrice?: decimal;
}

export interface PurchaseOrderBlocResult {
    created?: number;
    message?: string;
    purchaseOrderId?: string;
}

const COMPANY = '02';
const PURCHASE_SITE = '0201';
const RECEIPT_ADDRESS = 'SS1';
const CURRENCY = 'EUR';
const DEFAULT_PRODUCT = 'PAG103';
const TAX = '001';

function clean(value?: string): string {
    return value?.trim() ?? '';
}

function requiredString(value: string | undefined, name: string): string {
    const result = clean(value);
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

function buildNewLine(
    parameters: PurchaseOrderBlocParameters,
    productCode: string,
    quantity: decimal,
): Record<string, any> {
    const supplierCode = requiredString(parameters.supplierCode, 'supplierCode');
    const xylolinkLineId = requiredString(parameters.xylolinkLineId, 'xylolinkLineId');
    const orderUnit = requiredString(parameters.orderUnit, 'orderUnit');
    const expectedReceiptDate = requiredValue(parameters.expectedReceiptDate, 'expectedReceiptDate');
    const grossPrice = requiredValue(parameters.grossPrice, 'grossPrice');

    return {
        company: COMPANY,
        purchaseSite: PURCHASE_SITE,
        orderFromSupplier: supplierCode,
        yxylolin: xylolinkLineId,
        product: productCode,
        productType: 'standard' as const,
        purchaseType: 'purchase' as const,
        orderUnit,
        purchaseUnit: orderUnit,
        stockUnit: orderUnit,
        orderUnitToPurchaseUnitConversionFactor: 1,
        quantityInOrderUnitOrdered: quantity,
        quantityInStockUnitOrdered: quantity,
        expectedReceiptDate,
        receiptSite: PURCHASE_SITE,
        receiptAddress: RECEIPT_ADDRESS,
        grossPrice,
        netPrice: grossPrice,
    };
}

function buildHeaderUpdate(parameters: PurchaseOrderBlocParameters): Record<string, any> {
    const data: Record<string, any> = { _x3Transaction: 'ALL' };
    const orderNumber = clean(parameters.xylolinkOrderNumber);
    const supplierCode = clean(parameters.supplierCode);
    const cuttingId = clean(parameters.cuttingId);

    if (parameters.orderDate !== undefined) data.orderDate = parameters.orderDate;
    if (orderNumber) data.internalOrderReference = orderNumber;
    if (supplierCode) data.orderFromSupplier = supplierCode;
    if (cuttingId) data.project = cuttingId;

    return data;
}

function buildLineUpdate(parameters: PurchaseOrderBlocParameters): Record<string, any> {
    const data: Record<string, any> = {};
    const supplierCode = clean(parameters.supplierCode);
    const productCode = clean(parameters.productCode);
    const orderUnit = clean(parameters.orderUnit);

    if (supplierCode) data.orderFromSupplier = supplierCode;
    if (productCode) data.product = productCode;
    if (orderUnit) {
        data.orderUnit = orderUnit;
        data.purchaseUnit = orderUnit;
        data.stockUnit = orderUnit;
    }
    if (parameters.quantity !== undefined) {
        data.quantityInOrderUnitOrdered = parameters.quantity;
        data.quantityInStockUnitOrdered = parameters.quantity;
    }
    if (parameters.expectedReceiptDate !== undefined) {
        data.expectedReceiptDate = parameters.expectedReceiptDate;
    }
    if (parameters.grossPrice !== undefined) {
        data.grossPrice = parameters.grossPrice;
        data.netPrice = parameters.grossPrice;
    }

    return data;
}

async function executePurchaseOrderBloc(
    context: Context,
    parameters: PurchaseOrderBlocParameters,
): Promise<PurchaseOrderBlocResult> {
    const existingPurchaseOrderId = clean(parameters.existingPurchaseOrderId);
    const xylolinkLineId = clean(parameters.xylolinkLineId);

    if (existingPurchaseOrderId) {
        const purchaseOrder = await context.tryRead(
            sageX3Purchasing.nodes.PurchaseOrder,
            { id: existingPurchaseOrderId },
            { forUpdate: true },
        );

        if (!purchaseOrder) {
            throw new Error(`Commande d'achat introuvable : ${existingPurchaseOrderId}`);
        }

        const headerData = buildHeaderUpdate(parameters);
        let existingLine: sageX3Purchasing.nodes.PurchaseOrderLine | null = null;

        if (xylolinkLineId) {
            existingLine = await purchaseOrder.purchaseOrderLines.takeOne(
                async line => clean(await line.$.getValue<string>('yxylolin')) === xylolinkLineId,
            );
        }

        if (existingLine) {
            const changedValues = buildLineUpdate(parameters);
            if (Object.keys(changedValues).length > 0) {
                headerData.purchaseOrderLines = [
                    {
                        _action: 'update',
                        _id: await existingLine._id,
                        ...changedValues,
                    },
                ];
            }
        } else if (xylolinkLineId) {
            const missingParameters = [
                !clean(parameters.supplierCode) && 'supplierCode',
                !clean(parameters.orderUnit) && 'orderUnit',
                parameters.expectedReceiptDate === undefined && 'expectedReceiptDate',
                parameters.grossPrice === undefined && 'grossPrice',
            ].filter(Boolean);

            if (missingParameters.length > 0) {
                return {
                    created: 0,
                    message:
                        `Ligne Xylolink introuvable : ${xylolinkLineId}. ` +
                        `Pour l'ajouter, renseignez : ${missingParameters.join(', ')}.`,
                    purchaseOrderId: existingPurchaseOrderId,
                };
            }

            const productCode = clean(parameters.productCode) || DEFAULT_PRODUCT;
            const quantity = parameters.quantity ?? (1 as decimal);
            const lineData = buildNewLine(parameters, productCode, quantity);

            headerData.purchaseOrderLines = [
                {
                    _action: 'create',
                    ...lineData,
                    taxes: [{ denormalizedIndex: 1, tax: TAX }],
                },
            ];
        }

        await purchaseOrder.$.set(headerData as any);
        await purchaseOrder.$.save();

        return {
            created: 0,
            message: existingLine
                ? `Commande d'achat ${existingPurchaseOrderId} modifiee avec succes.`
                : xylolinkLineId
                  ? `Nouvelle ligne ajoutee a la commande ${existingPurchaseOrderId}.`
                  : `Commande d'achat ${existingPurchaseOrderId} modifiee avec succes.`,
            purchaseOrderId: existingPurchaseOrderId,
        };
    }

    const orderDate = requiredValue(parameters.orderDate, 'orderDate');
    const orderNumber = requiredString(parameters.xylolinkOrderNumber, 'xylolinkOrderNumber');
    const supplierCode = requiredString(parameters.supplierCode, 'supplierCode');
    const cuttingId = requiredString(parameters.cuttingId, 'cuttingId');
    const productCode = clean(parameters.productCode) || DEFAULT_PRODUCT;
    const quantity = parameters.quantity ?? (1 as decimal);
    const lineData = buildNewLine(parameters, productCode, quantity);

    const purchaseOrder = await context.create(sageX3Purchasing.nodes.PurchaseOrder, {
        _x3Transaction: 'ALL',
        company: COMPANY,
        purchaseSite: PURCHASE_SITE,
        orderDate,
        internalOrderReference: orderNumber,
        orderFromSupplier: supplierCode,
        project: cuttingId,
        currency: CURRENCY,
        purchaseOrderLines: [
            {
                ...lineData,
                taxes: [{ denormalizedIndex: 1, tax: TAX }],
            },
        ],
    } as any);

    await purchaseOrder.$.save();
    const purchaseOrderId = await purchaseOrder.id;

    return {
        created: 1,
        message: `Commande d'achat ${purchaseOrderId} creee avec succes.`,
        purchaseOrderId,
    };
}

export async function purchaseOrderBloc(
    context: Context,
    parameters: PurchaseOrderBlocParameters,
): Promise<PurchaseOrderBlocResult> {
    try {
        return await executePurchaseOrderBloc(context, parameters);
    } catch (error) {
        return {
            created: 0,
            message: error instanceof Error ? error.message : String(error),
            purchaseOrderId: clean(parameters.existingPurchaseOrderId),
        };
    }
}
