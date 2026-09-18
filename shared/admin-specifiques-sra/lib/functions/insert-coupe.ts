import { Context, DateValue } from "@sage/xtrem-core";
import { X3StorageManager } from "@sage/xtrem-x3-gateway";

type InsertCoupeParameters = {
  id?: string;
  name?: string;
  originCode?: string;
  owner?: string;
  buyer?: string;
  saleMode?: string;
  contractStarting?: DateValue;
  contractEnding?: DateValue;
  address?: string;
  zipCode?: string;
  city?: string;
  country?: string;
};

type InsertCoupeResult = {
  createId?: string;
  status?: number;
  message?: string;
  logId?: string;
};

type WriteLogResult = {
  outLogid: string;
  outStatus: number;
  outMessage: string;
};

async function writeLog(
  context: Context,
  parameters: {
    operation: string;
    objectid: string;
    status: string;
    errcod: string;
    message: string;
  },
): Promise<WriteLogResult> {
  return X3StorageManager.executeApiOperation<WriteLogResult>(
    context,
    "SCRIPT",
    "Coupe",
    "writeLog",
    {
      ...parameters,
      outLogid: "",
      outStatus: 0,
      outMessage: "",
    },
  );
}

export async function insertCoupe(
  context: Context,
  parameters: InsertCoupeParameters,
): Promise<InsertCoupeResult> {
  try {
    await X3StorageManager.executeApiOperation(
      context,
      "IMPORT",
      "Coupe",
      "importCoupe",
      {
        id: parameters.id,
        category: parameters.saleMode,
        salesRepresentative: parameters.buyer,
        businessPartner: parameters.owner,
        currency: "EUR",
        site: parameters.originCode,
        projectLink: parameters.name
          ? {
              localizedDescription: parameters.name,
            }
          : undefined,
        openingDate: parameters.contractStarting,
        yoppdatend: parameters.contractEnding,
        yadresse: parameters.address,
        ypostal: parameters.zipCode,
        ycity: parameters.city,
        ypays: parameters.country,
      },
    );

    const log = await writeLog(context, {
      operation: "insertCoupe",
      objectid: parameters.id ?? "",
      status: "OK",
      errcod: "",
      message: "Affaire importee",
    });

    return {
      createId: parameters.id,
      status: 1,
      message: "Affaire importee",
      logId: log.outLogid,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    const log = await writeLog(context, {
      operation: "insertCoupe",
      objectid: parameters.id ?? "",
      status: "ERR",
      errcod: "IMPORT",
      message,
    });

    return {
      createId: parameters.id,
      status: 0,
      message,
      logId: log.outLogid,
    };
  }
}
