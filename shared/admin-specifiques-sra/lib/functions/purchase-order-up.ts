import * as sageX3MasterData from "@sage/x3-master-data";
import * as sageX3Purchasing from "@sage/x3-purchasing";
import { Context, DateValue, decimal } from "@sage/xtrem-core";

export interface PurchaseOrderUpParameters {
  existingPurchaseOrderId?: string;
  xylolinkOrderNumber: string;
  orderDate: DateValue;
  supplierCode: string;
  cuttingId: string;
  xylolinkLineId: string;
  productCode?: string;
  qualityCode?: string;
  speciesCode: string;
  orderUnit: string;
  quantity: decimal;
  expectedReceiptDate: DateValue;
  grossPrice: decimal;
}

export interface PurchaseOrderUpResult {
  created?: number;
  message?: string;
  purchaseOrderId?: string;
  resolvedProductCode?: string;
}

const COMPANY = "02";
const PURCHASE_SITE = "0201";
const SUPPLIER_ADDRESS = "01";
const RECEIPT_ADDRESS = "SS1";
const CURRENCY = "EUR";
const PAYMENT_TERM = "BOR30JFDM";
const TAX_RULE = "FRA";
const BUYER = "ADMIN";
const TAX = "001";

function clean(value?: string): string {
  return value?.trim() ?? "";
}

export async function purchaseOrderUp(
  context: Context,
  parameters: PurchaseOrderUpParameters,
): Promise<PurchaseOrderUpResult> {
  const existingPurchaseOrderId = clean(
    parameters.existingPurchaseOrderId,
  );

  const productCode = clean(parameters.productCode);
  const qualityCode = clean(parameters.qualityCode);
  const speciesCode = clean(parameters.speciesCode);
  const xylolinkLineId = clean(parameters.xylolinkLineId);

  /*
   * Le code produit est prioritaire sur le code qualite.
   *
   * Exemple :
   * productCode = "PAG"
   * speciesCode = "103"
   * resultat = "PAG103"
   */
  if (!productCode && !qualityCode) {
    return {
      created: 0,
      message:
        "Creation impossible : productCode ou qualityCode doit etre renseigne.",
      purchaseOrderId: existingPurchaseOrderId,
      resolvedProductCode: "",
    };
  }

  if (!speciesCode) {
    return {
      created: 0,
      message:
        "Creation impossible : speciesCode doit etre renseigne.",
      purchaseOrderId: existingPurchaseOrderId,
      resolvedProductCode: "",
    };
  }

  const resolvedProductCode =
    (productCode || qualityCode) + speciesCode;

  /*
   * Verification de l'existence de l'article compose dans X3.
   */
  const productExists = await context.exists(
    sageX3MasterData.nodes.Product,
    { code: resolvedProductCode },
  );

  if (!productExists) {
    return {
      created: 0,
      message: `Article X3 introuvable : ${resolvedProductCode}`,
      purchaseOrderId: existingPurchaseOrderId,
      resolvedProductCode,
    };
  }

  /*
   * Donnees communes de la ligne.
   *
   * Il ne faut pas mettre "_action: create" ici.
   * context.create() sait deja qu'il s'agit d'une creation.
   */
  const lineData = {
  company: "02",
  purchaseSite: "0201",
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
  receiptSite: "0201",
  receiptAddress: "SS1",

  grossPrice: parameters.grossPrice,
  netPrice: parameters.grossPrice,
};

  try {
    /*
     * MODIFICATION D'UNE COMMANDE EXISTANTE
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
            `Commande d'achat introuvable : ${existingPurchaseOrderId}`,
          purchaseOrderId: existingPurchaseOrderId,
          resolvedProductCode,
        };
      }

      /*
       * Recherche d'une ligne existante avec le meme identifiant
       * Xylolink.
       */
      const existingLine =
        await purchaseOrder.purchaseOrderLines.takeOne(
          async (line) =>
            clean(await (line as any).yxylolin) ===
            xylolinkLineId,
        );

      const headerData = {
        _x3Transaction: "ALL",
        orderDate: parameters.orderDate,
        internalOrderReference:
          parameters.xylolinkOrderNumber,
        project: parameters.cuttingId,
        expectedReceiptDate:
          parameters.expectedReceiptDate,
      };

      if (existingLine) {
        /*
         * La ligne existe : modification avec son identifiant
         * technique GraphQL.
         */
        const updateLineData: Record<string, any> = {
          ...lineData,
          _action: "update",
          _id: await existingLine._id,
        };

        /*
         * On ne recree pas les taxes d'une ligne existante.
         */
        delete updateLineData.taxes;

        await purchaseOrder.$.set({
          ...headerData,
          purchaseOrderLines: [updateLineData],
        } as any);

        await purchaseOrder.$.save();

        return {
          created: 0,
          message:
            `Commande ${existingPurchaseOrderId} et ligne ` +
            `${xylolinkLineId} modifiees avec succes.`,
          purchaseOrderId: existingPurchaseOrderId,
          resolvedProductCode,
        };
      }

      /*
       * La commande existe, mais pas la ligne :
       * ajout d'une nouvelle ligne par l'API Collection.
       */
      await purchaseOrder.purchaseOrderLines.append(
        lineData as any,
      );

      await purchaseOrder.$.set(headerData as any);
      await purchaseOrder.$.save();

      return {
        created: 0,
        message:
          `Ligne ${xylolinkLineId} ajoutee a la commande ` +
          `${existingPurchaseOrderId}.`,
        purchaseOrderId: existingPurchaseOrderId,
        resolvedProductCode,
      };
    }

    /*
     * CREATION D'UNE NOUVELLE COMMANDE
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