import * as sageX3MasterData from "@sage/x3-master-data";
import { Context, DateValue, decimal, NodeQueryFilter } from "@sage/xtrem-core";

import { YmiscellaneousReceipt } from "../nodes/ymiscellaneous-receipt";

export interface CreateMiscellaneousReceiptFromStatsParameters {
  statisticalGroup1: string;
  statisticalGroup2: string;
  statisticalGroup3: string;
  id: string;
  stockSiteCode: string;
  effectiveDate: DateValue;
  documentDescription?: string;
  stockMovementGroup?: string;
  packingUnit: string;
  quantityInPackingUnit: decimal;
  packingUnitToStockUnitConversionFactor: decimal;
  quantityInStockUnit: decimal;
}

export interface CreateMiscellaneousReceiptFromStatsResult {
  created?: number;
  message?: string;
  matchCount?: number;
  productCode?: string;
  receiptId?: string;
}

const noProductMessage =
  "Creation de l'entree diverse impossible, pas d'article trouve avec ces caracteristiques";
const multipleProductsMessage =
  "Creation de l'entree diverse impossible, plus d'un article trouve avec ces caracteristiques";

export async function createMiscellaneousReceiptFromStats(
  context: Context,
  parameters: CreateMiscellaneousReceiptFromStatsParameters,
): Promise<CreateMiscellaneousReceiptFromStatsResult> {
  const filter: NodeQueryFilter<sageX3MasterData.nodes.Product> = {
    _and: [
      {
        statisticalGroups: {
          _atLeast: 1,
          denormalizedIndex: 1,
          statisticalGroup: parameters.statisticalGroup1,
        },
      },
      {
        statisticalGroups: {
          _atLeast: 1,
          denormalizedIndex: 2,
          statisticalGroup: parameters.statisticalGroup2,
        },
      },
      {
        statisticalGroups: {
          _atLeast: 1,
          denormalizedIndex: 3,
          statisticalGroup: parameters.statisticalGroup3,
        },
      },
    ],
  };

  const matchCount = await context.queryCount(sageX3MasterData.nodes.Product, {
    filter,
  });

  if (matchCount === 0) {
    return {
      created: 0,
      message: noProductMessage,
      matchCount,
      productCode: "",
      receiptId: "",
    };
  }

  if (matchCount > 1) {
    return {
      created: 0,
      message: multipleProductsMessage,
      matchCount,
      productCode: "",
      receiptId: "",
    };
  }

  const products = await context
    .query(sageX3MasterData.nodes.Product, {
      filter,
      first: 1,
    })
    .toArray();
  const product = products[0];

  if (!product) {
    return {
      created: 0,
      message: noProductMessage,
      matchCount: 0,
      productCode: "",
      receiptId: "",
    };
  }

  const productCode = await product.code;
  const productDescription = await product.localizedDescription1;
  const entryType = "miscellaneousReceipt" as const;

  const receiptData = {
    entryType,
    id: parameters.id,
    stockSite: parameters.stockSiteCode,
    effectiveDate: parameters.effectiveDate,
    documentDescription: parameters.documentDescription ?? "",
    ymiscellaneousReceiptLine: [
      {
        entryType,
        product: productCode,
        productDescription,
        packingUnit: parameters.packingUnit,
        quantityInPackingUnit: parameters.quantityInPackingUnit,
        packingUnitToStockUnitConversionFactor:
          parameters.packingUnitToStockUnitConversionFactor,
        quantityInStockUnit: parameters.quantityInStockUnit,
        stockDetails: [
          {
            movementDescription: parameters.documentDescription ?? "",
            packingUnit: parameters.packingUnit,
            quantityInPackingUnit: parameters.quantityInPackingUnit,
            packingUnitToStockUnitConversionFactor:
              parameters.packingUnitToStockUnitConversionFactor,
            status: "A",
          },
        ],
      },
    ],
  };

  if (parameters.stockMovementGroup) {
    Object.assign(receiptData, {
      stockMovementGroup: parameters.stockMovementGroup,
    });
  }

  const receipt = await context.create(YmiscellaneousReceipt, receiptData);

  await receipt.$.save();
  const receiptId = await receipt.id;

  return {
    created: 1,
    message: `Entree diverse ${receiptId} creee avec succes pour l'article ${productCode}`,
    matchCount,
    productCode,
    receiptId,
  };
}
