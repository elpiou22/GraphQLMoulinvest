import { X3EnumDataType } from '@sage/xtrem-x3-gateway';
export declare enum EntryTypeEnumEnum {
    customer = 1,
    salesOrder = 2,
    picking = 3,
    delivery = 4,
    salesInvoice = 5,
    receipt = 6,
    transferInactive = 7,
    supplierReturn = 8,
    count = 9,
    workOrder = 10,
    suggestion = 11,
    productionTracking = 12,
    customerReturn = 13,
    purchaseOrder = 14,
    productionDeclaration = 15,
    miscellaneousStockInactive = 16,
    supplierInvoice = 17,
    salesCredit = 18,
    miscellaneousReceipt = 19,
    miscellaneousIssue = 20,
    locationChangeInactive = 21,
    intersiteTransferInactive = 22,
    intersiteTransferReceiptInactive = 23,
    transferForSubcontractingInactive = 24,
    receiptForSubcontractingInactive = 25,
    returnToStockInactive = 26,
    putawayPlan = 27,
    qualityControl = 28,
    stockChange = 29,
    valueChange = 30,
    assembly = 31,
    disassembly = 32,
    serviceRequest = 33,
    reorderPlan = 34,
    lotModification = 35,
    subcontractOrder = 36,
    trackingWoWo = 37,
    shipment = 38,
    transport = 39,
    project = 40
}
export interface EntryTypeEnum$EnumInterface {
    customer: 1;
    salesOrder: 2;
    picking: 3;
    delivery: 4;
    salesInvoice: 5;
    receipt: 6;
    transferInactive: 7;
    supplierReturn: 8;
    count: 9;
    workOrder: 10;
    suggestion: 11;
    productionTracking: 12;
    customerReturn: 13;
    purchaseOrder: 14;
    productionDeclaration: 15;
    miscellaneousStockInactive: 16;
    supplierInvoice: 17;
    salesCredit: 18;
    miscellaneousReceipt: 19;
    miscellaneousIssue: 20;
    locationChangeInactive: 21;
    intersiteTransferInactive: 22;
    intersiteTransferReceiptInactive: 23;
    transferForSubcontractingInactive: 24;
    receiptForSubcontractingInactive: 25;
    returnToStockInactive: 26;
    putawayPlan: 27;
    qualityControl: 28;
    stockChange: 29;
    valueChange: 30;
    assembly: 31;
    disassembly: 32;
    serviceRequest: 33;
    reorderPlan: 34;
    lotModification: 35;
    subcontractOrder: 36;
    trackingWoWo: 37;
    shipment: 38;
    transport: 39;
    project: 40;
}
export type EntryTypeEnum = keyof EntryTypeEnum$EnumInterface;
export declare const entryTypeEnumDatatype: X3EnumDataType<keyof EntryTypeEnum$EnumInterface, unknown>;
//# sourceMappingURL=entry-type-enum.d.ts.map