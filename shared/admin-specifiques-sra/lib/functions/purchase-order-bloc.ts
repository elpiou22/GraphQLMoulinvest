import * as sageX3Purchasing from "@sage/x3-purchasing";
import { Context, DateValue, decimal } from "@sage/xtrem-core";

export interface PurchaseOrderBlocParameters {
  existingPurchaseOrderId?: string;
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
}

export interface PurchaseOrderBlocResult {
  created?: number;
  message?: string;
  purchaseOrderId?: string;
}

export async function purchaseOrderBloc(
  context: Context,
  parameters: PurchaseOrderBlocParameters,
): Promise<PurchaseOrderBlocResult> {
  const existingPurchaseOrderId =
    parameters.existingPurchaseOrderId?.trim();

  const productCode =
    parameters.productCode?.trim() || "PAG103";

  const quantity =
    parameters.quantity ?? (1 as decimal);

  const lineData = {
    company: "02",
    purchaseSite: "0201",
    orderFromSupplier: parameters.supplierCode,

    yxylolin: parameters.xylolinkLineId,

    product: productCode,
    productType: "standard" as const,
    purchaseType: "purchase" as const,

    orderUnit: parameters.orderUnit,
    purchaseUnit: parameters.orderUnit,
    stockUnit: parameters.orderUnit,
    orderUnitToPurchaseUnitConversionFactor: 1,

    quantityInOrderUnitOrdered: quantity,
    quantityInStockUnitOrdered: quantity,

    expectedReceiptDate: parameters.expectedReceiptDate,
    receiptSite: "0201",
    receiptAddress: "SS1",

    grossPrice: parameters.grossPrice,
    netPrice: parameters.grossPrice,
  };

  /*
   * Modification d'une commande existante
   */
  if (existingPurchaseOrderId) {
    const purchaseOrders = await context
      .query(sageX3Purchasing.nodes.PurchaseOrder, {
        filter: {
          id: existingPurchaseOrderId,
        },
        first: 1,
        forUpdate: true,
      })
      .toArray();

    const purchaseOrder = purchaseOrders[0];

    if (!purchaseOrder) {
      throw new Error(
        `Commande d'achat introuvable : ${existingPurchaseOrderId}`,
      );
    }

    await purchaseOrder.$.set({
      _x3Transaction: "ALL",
      orderDate: parameters.orderDate,
      internalOrderReference: parameters.xylolinkOrderNumber,
      orderFromSupplier: parameters.supplierCode,
      project: parameters.cuttingId,
      currency: "EUR",
    });

    const purchaseOrderLines =
      await purchaseOrder.purchaseOrderLines.toArray();

    let existingLine:
      | sageX3Purchasing.nodes.PurchaseOrderLine
      | undefined;

    for (const line of purchaseOrderLines) {
      const xylolinkLineId =
        await line.$.getValue<string>("yxylolin");

      if (xylolinkLineId === parameters.xylolinkLineId) {
        existingLine = line;
        break;
      }
    }

    if (existingLine) {
      await existingLine.$.set(lineData as any);
    } else {
      await purchaseOrder.purchaseOrderLines.append({
        ...lineData,
        taxes: [
          {
            denormalizedIndex: 1,
            tax: "001",
          },
        ],
      } as any);
    }

    await purchaseOrder.$.save();

    return {
      created: 0,
      message: existingLine
        ? `Commande d'achat ${existingPurchaseOrderId} modifiee avec succes`
        : `Nouvelle ligne ajoutee a la commande ${existingPurchaseOrderId}`,
      purchaseOrderId: existingPurchaseOrderId,
    };
  }

  /*
   * Creation d'une nouvelle commande
   */
  const purchaseOrder = await context.create(
    sageX3Purchasing.nodes.PurchaseOrder,
    {
      _x3Transaction: "ALL",

      company: "02",
      purchaseSite: "0201",
      orderDate: parameters.orderDate,
      internalOrderReference: parameters.xylolinkOrderNumber,

      orderFromSupplier: parameters.supplierCode,
      project: parameters.cuttingId,
      currency: "EUR",

      purchaseOrderLines: [
        {
          ...lineData,
          taxes: [
            {
              denormalizedIndex: 1,
              tax: "001",
            },
          ],
        },
      ],
    } as any,
  );

  await purchaseOrder.$.save();

  const purchaseOrderId = await purchaseOrder.id;

  return {
    created: 1,
    message: `Commande d'achat ${purchaseOrderId} creee avec succes`,
    purchaseOrderId,
  };
}