"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entryTypeEnumDatatype = exports.EntryTypeEnumEnum = void 0;
const xtrem_x3_gateway_1 = require("@sage/xtrem-x3-gateway");
var EntryTypeEnumEnum;
(function (EntryTypeEnumEnum) {
    EntryTypeEnumEnum[EntryTypeEnumEnum["customer"] = 1] = "customer";
    EntryTypeEnumEnum[EntryTypeEnumEnum["salesOrder"] = 2] = "salesOrder";
    EntryTypeEnumEnum[EntryTypeEnumEnum["picking"] = 3] = "picking";
    EntryTypeEnumEnum[EntryTypeEnumEnum["delivery"] = 4] = "delivery";
    EntryTypeEnumEnum[EntryTypeEnumEnum["salesInvoice"] = 5] = "salesInvoice";
    EntryTypeEnumEnum[EntryTypeEnumEnum["receipt"] = 6] = "receipt";
    EntryTypeEnumEnum[EntryTypeEnumEnum["transferInactive"] = 7] = "transferInactive";
    EntryTypeEnumEnum[EntryTypeEnumEnum["supplierReturn"] = 8] = "supplierReturn";
    EntryTypeEnumEnum[EntryTypeEnumEnum["count"] = 9] = "count";
    EntryTypeEnumEnum[EntryTypeEnumEnum["workOrder"] = 10] = "workOrder";
    EntryTypeEnumEnum[EntryTypeEnumEnum["suggestion"] = 11] = "suggestion";
    EntryTypeEnumEnum[EntryTypeEnumEnum["productionTracking"] = 12] = "productionTracking";
    EntryTypeEnumEnum[EntryTypeEnumEnum["customerReturn"] = 13] = "customerReturn";
    EntryTypeEnumEnum[EntryTypeEnumEnum["purchaseOrder"] = 14] = "purchaseOrder";
    EntryTypeEnumEnum[EntryTypeEnumEnum["productionDeclaration"] = 15] = "productionDeclaration";
    EntryTypeEnumEnum[EntryTypeEnumEnum["miscellaneousStockInactive"] = 16] = "miscellaneousStockInactive";
    EntryTypeEnumEnum[EntryTypeEnumEnum["supplierInvoice"] = 17] = "supplierInvoice";
    EntryTypeEnumEnum[EntryTypeEnumEnum["salesCredit"] = 18] = "salesCredit";
    EntryTypeEnumEnum[EntryTypeEnumEnum["miscellaneousReceipt"] = 19] = "miscellaneousReceipt";
    EntryTypeEnumEnum[EntryTypeEnumEnum["miscellaneousIssue"] = 20] = "miscellaneousIssue";
    EntryTypeEnumEnum[EntryTypeEnumEnum["locationChangeInactive"] = 21] = "locationChangeInactive";
    EntryTypeEnumEnum[EntryTypeEnumEnum["intersiteTransferInactive"] = 22] = "intersiteTransferInactive";
    EntryTypeEnumEnum[EntryTypeEnumEnum["intersiteTransferReceiptInactive"] = 23] = "intersiteTransferReceiptInactive";
    EntryTypeEnumEnum[EntryTypeEnumEnum["transferForSubcontractingInactive"] = 24] = "transferForSubcontractingInactive";
    EntryTypeEnumEnum[EntryTypeEnumEnum["receiptForSubcontractingInactive"] = 25] = "receiptForSubcontractingInactive";
    EntryTypeEnumEnum[EntryTypeEnumEnum["returnToStockInactive"] = 26] = "returnToStockInactive";
    EntryTypeEnumEnum[EntryTypeEnumEnum["putawayPlan"] = 27] = "putawayPlan";
    EntryTypeEnumEnum[EntryTypeEnumEnum["qualityControl"] = 28] = "qualityControl";
    EntryTypeEnumEnum[EntryTypeEnumEnum["stockChange"] = 29] = "stockChange";
    EntryTypeEnumEnum[EntryTypeEnumEnum["valueChange"] = 30] = "valueChange";
    EntryTypeEnumEnum[EntryTypeEnumEnum["assembly"] = 31] = "assembly";
    EntryTypeEnumEnum[EntryTypeEnumEnum["disassembly"] = 32] = "disassembly";
    EntryTypeEnumEnum[EntryTypeEnumEnum["serviceRequest"] = 33] = "serviceRequest";
    EntryTypeEnumEnum[EntryTypeEnumEnum["reorderPlan"] = 34] = "reorderPlan";
    EntryTypeEnumEnum[EntryTypeEnumEnum["lotModification"] = 35] = "lotModification";
    EntryTypeEnumEnum[EntryTypeEnumEnum["subcontractOrder"] = 36] = "subcontractOrder";
    EntryTypeEnumEnum[EntryTypeEnumEnum["trackingWoWo"] = 37] = "trackingWoWo";
    EntryTypeEnumEnum[EntryTypeEnumEnum["shipment"] = 38] = "shipment";
    EntryTypeEnumEnum[EntryTypeEnumEnum["transport"] = 39] = "transport";
    EntryTypeEnumEnum[EntryTypeEnumEnum["project"] = 40] = "project";
})(EntryTypeEnumEnum || (exports.EntryTypeEnumEnum = EntryTypeEnumEnum = {}));
exports.entryTypeEnumDatatype = new xtrem_x3_gateway_1.X3EnumDataType({
    enum: EntryTypeEnumEnum,
    filename: __filename,
    localMenuNumber: 701,
});
//# sourceMappingURL=entry-type-enum.js.map