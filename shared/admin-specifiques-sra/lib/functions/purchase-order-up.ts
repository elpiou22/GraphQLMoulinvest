import * as sageX3MasterData from '@sage/x3-master-data';
import * as sageX3Purchasing from '@sage/x3-purchasing';
import { Context, DateValue, decimal } from '@sage/xtrem-core';

export interface PurchaseOrderUpParameters {
    existingPurchaseOrderId?: string;
    xylolinkOrderNumber?: string;
    orderDate?: DateValue;
    supplierCode?: string;
    cuttingId?: string;
    xylolinkLineId?: string;
    productCode?: string;
    qualityCode?: string;
    speciesCode?: string;
    orderUnit?: string;
    quantity?: decimal;
    expectedReceiptDate?: DateValue;
    grossPrice?: decimal;
}

export interface PurchaseOrderUpResult {
    created?: number;
    message?: string;
    purchaseOrderId?: string;
    resolvedProductCode?: string;
}

const COMPANY = '02';
const PURCHASE_SITE = '0201';
const RECEIPT_ADDRESS = 'SS1';
const CURRENCY = 'EUR';
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

async function resolveProductCode(
    context: Context,
    parameters: PurchaseOrderUpParameters,
    required: boolean,
): Promise<string> {
    const productCode = clean(parameters.productCode);
    const qualityCode = clean(parameters.qualityCode);
    const speciesCode = clean(parameters.speciesCode);
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

function buildHeaderUpdate(parameters: PurchaseOrderUpParameters): Record<string, any> {
    const data: Record<string, any> = { _x3Transaction: 'ALL' };
    const orderNumber = clean(parameters.xylolinkOrderNumber);
    const supplierCode = clean(parameters.supplierCode);
    const cuttingId = clean(parameters.cuttingId);

    if (parameters.orderDate !== undefined) data.orderDate = parameters.orderDate;
    if (orderNumber) data.internalOrderReference = orderNumber;
    if (supplierCode) data.orderFromSupplier = supplierCode;
    if (cuttingId) data.project = cuttingId;
    if (parameters.expectedReceiptDate !== undefined) {
        data.expectedReceiptDate = parameters.expectedReceiptDate;
    }

    return data;
}

function buildLineUpdate(parameters: PurchaseOrderUpParameters, resolvedProductCode: string): Record<string, any> {
    const data: Record<string, any> = {};
    const supplierCode = clean(parameters.supplierCode);
    const orderUnit = clean(parameters.orderUnit);

    if (supplierCode) data.orderFromSupplier = supplierCode;
    if (resolvedProductCode) data.product = resolvedProductCode;
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

function buildNewLine(parameters: PurchaseOrderUpParameters, resolvedProductCode: string): Record<string, any> {
    const supplierCode = requiredString(parameters.supplierCode, 'supplierCode');
    const xylolinkLineId = requiredString(parameters.xylolinkLineId, 'xylolinkLineId');
    const orderUnit = requiredString(parameters.orderUnit, 'orderUnit');
    const quantity = requiredValue(parameters.quantity, 'quantity');
    const expectedReceiptDate = requiredValue(parameters.expectedReceiptDate, 'expectedReceiptDate');
    const grossPrice = requiredValue(parameters.grossPrice, 'grossPrice');

    return {
        company: COMPANY,
        purchaseSite: PURCHASE_SITE,
        orderFromSupplier: supplierCode,
        yxylolin: xylolinkLineId,
        product: resolvedProductCode,
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

export async function purchaseOrderUp(
    context: Context,
    parameters: PurchaseOrderUpParameters,
): Promise<PurchaseOrderUpResult> {
    const existingPurchaseOrderId = clean(parameters.existingPurchaseOrderId);
    const xylolinkLineId = clean(parameters.xylolinkLineId);
    let resolvedProductCode = '';

    try {
        if (existingPurchaseOrderId) {
            resolvedProductCode = await resolveProductCode(context, parameters, false);

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
                const changedValues = buildLineUpdate(parameters, resolvedProductCode);

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
                if (!resolvedProductCode) {
                    resolvedProductCode = await resolveProductCode(context, parameters, true);
                }
                const lineData = buildNewLine(parameters, resolvedProductCode);
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
                    ? `Commande ${existingPurchaseOrderId} et ligne ${xylolinkLineId} modifiees avec succes.`
                    : xylolinkLineId
                      ? `Ligne ${xylolinkLineId} ajoutee a la commande ${existingPurchaseOrderId}.`
                      : `Commande ${existingPurchaseOrderId} modifiee avec succes.`,
                purchaseOrderId: existingPurchaseOrderId,
                resolvedProductCode,
            };
        }

        resolvedProductCode = await resolveProductCode(context, parameters, true);
        const orderDate = requiredValue(parameters.orderDate, 'orderDate');
        const orderNumber = requiredString(parameters.xylolinkOrderNumber, 'xylolinkOrderNumber');
        const supplierCode = requiredString(parameters.supplierCode, 'supplierCode');
        const cuttingId = requiredString(parameters.cuttingId, 'cuttingId');
        const lineData = buildNewLine(parameters, resolvedProductCode);

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
            resolvedProductCode,
        };
    } catch (error) {
        return {
            created: 0,
            message: error instanceof Error ? error.message : String(error),
            purchaseOrderId: existingPurchaseOrderId,
            resolvedProductCode,
        };
    }
}
