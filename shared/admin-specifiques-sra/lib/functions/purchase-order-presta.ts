import * as sageX3MasterData from "@sage/x3-master-data";
import * as sageX3Purchasing from "@sage/x3-purchasing";
import { Context, DateValue, decimal } from "@sage/xtrem-core";

export interface PurchaseOrderPrestaParameters {
  existingPurchaseOrderId?: string;
  xylolinkOrderNumber: string;
  orderDate: DateValue;
  supplierCode: string;
  cuttingId: string;
  xylolinkLineId: string;
  category: string;
  orderUnit: string;
  quantity: decimal;
  expectedReceiptDate: DateValue;
  grossPrice: decimal;
}

export interface PurchaseOrderPrestaResult {
  created?: number;
  message?: string;
  purchaseOrderId?: string;
  resolvedProductCode?: string;
}

const COMPANY = "02";
const PURCHASE_SITE = "0201";
const RECEIPT_ADDRESS = "SS1";
const CURRENCY = "EUR";
const TAX = "001";

const PRODUCT_BY_CATEGORY: Record<string, string> = {
  harvesting: "FOR-ABATTAGE",
  forwarding: "FOR-DEBARDAGE",
  transport: "FOR-TRANSPORT",
};

function clean(value?: string): string {
  return value?.trim() ?? "";
}

export async function purchaseOrderPresta(
  context: Context,
  parameters: PurchaseOrderPrestaParameters,
): Promise<PurchaseOrderPrestaResult> {
  const existingPurchaseOrderId = clean(
    parameters.existingPurchaseOrderId,
  );

  const xylolinkLineId = clean(parameters.xylolinkLineId);
  const category = clean(parameters.category).toLowerCase();

  const resolvedProductCode =
    PRODUCT_BY_CATEGORY[category];

  if (!resolvedProductCode) {
    return {
      created: 0,
      message:
        `Categorie invalide : ${parameters.category}. ` +
        "Valeurs acceptees : harvesting, forwarding, transport.",
      purchaseOrderId: existingPurchaseOrderId,
      resolvedProductCode: "",
    };
  }

  const productExists = await context.exists(
    sageX3MasterData.nodes.Product,
    { code: resolvedProductCode },
  );

  if (!productExists) {
    return {
      created: 0,
      message:
        `Article X3 introuvable : ${resolvedProductCode}`,
      purchaseOrderId: existingPurchaseOrderId,
      resolvedProductCode,
    };
  }

  const lineData = {
    company: COMPANY,
    purchaseSite: PURCHASE_SITE,
    orderFromSupplier: parameters.supplierCode,

    yxylolin: xylolinkLineId,

    product: resolvedProductCode,
    productType: "standard" as const,
    purchaseType: "purchase" as const,

    orderUnit: parameters.orderUnit,
    purchaseUnit: parameters.orderUnit,
    stockUnit: parameters.orderUnit,
    orderUnitToPurchaseUnitConversionFactor: 1,

    quantityInOrderUnitOrdered: parameters.quantity,
    quantityInStockUnitOrdered: parameters.quantity,

    expectedReceiptDate: parameters.expectedReceiptDate,
    receiptSite: PURCHASE_SITE,
    receiptAddress: RECEIPT_ADDRESS,

    grossPrice: parameters.grossPrice,
    netPrice: parameters.grossPrice,
  };

  try {
    /*
     * MODIFICATION
     */
    if (existingPurchaseOrderId) {
const purchaseOrder = await context.tryRead(
  sageX3Purchasing.nodes.PurchaseOrder,
  { id: existingPurchaseOrderId },
  { forUpdate: true },
);

      if (!purchaseOrder) {
        return {
          created: 0,
          message:
            `Commande d'achat introuvable : ` +
            existingPurchaseOrderId,
          purchaseOrderId: existingPurchaseOrderId,
          resolvedProductCode,
        };
      }

      await purchaseOrder.$.set({
        _x3Transaction: "ALL",
        orderDate: parameters.orderDate,
        internalOrderReference:
          parameters.xylolinkOrderNumber,
        orderFromSupplier: parameters.supplierCode,
        project: parameters.cuttingId,
        currency: CURRENCY,
      } as any);

      const purchaseOrderLines =
        await purchaseOrder.purchaseOrderLines.toArray();

      let existingLine:
        | (typeof purchaseOrderLines)[number]
        | undefined;

      for (const line of purchaseOrderLines) {
        const currentXylolinkLineId =
          await line.$.getValue<string>("yxylolin");

        if (
          clean(currentXylolinkLineId) ===
          xylolinkLineId
        ) {
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
              tax: TAX,
            },
          ],
        } as any);
      }

      await purchaseOrder.$.save();

      return {
        created: 0,
        message: existingLine
          ? `Commande ${existingPurchaseOrderId} et ligne ` +
            `${xylolinkLineId} modifiees avec succes.`
          : `Ligne ${xylolinkLineId} ajoutee a la commande ` +
            `${existingPurchaseOrderId}.`,
        purchaseOrderId: existingPurchaseOrderId,
        resolvedProductCode,
      };
    }

    /*
     * CREATION
     */
    const purchaseOrder = await context.create(
      sageX3Purchasing.nodes.PurchaseOrder,
      {
        _x3Transaction: "ALL",

        company: COMPANY,
        purchaseSite: PURCHASE_SITE,
        orderDate: parameters.orderDate,
        internalOrderReference:
          parameters.xylolinkOrderNumber,

        orderFromSupplier: parameters.supplierCode,
        project: parameters.cuttingId,
        currency: CURRENCY,

        purchaseOrderLines: [
          {
            ...lineData,
            taxes: [
              {
                denormalizedIndex: 1,
                tax: TAX,
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
      message:
        `Commande d'achat ${purchaseOrderId} creee avec succes.`,
      purchaseOrderId,
      resolvedProductCode,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    return {
      created: 0,
      message,
      purchaseOrderId: existingPurchaseOrderId,
      resolvedProductCode,
    };
  }
}