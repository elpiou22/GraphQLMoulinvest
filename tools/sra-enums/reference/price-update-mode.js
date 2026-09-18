"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceUpdateModeDatatype = exports.PriceUpdateModeEnum = void 0;
const xtrem_x3_gateway_1 = require("@sage/xtrem-x3-gateway");
var PriceUpdateModeEnum;
(function (PriceUpdateModeEnum) {
    PriceUpdateModeEnum[PriceUpdateModeEnum["calculated"] = 1] = "calculated";
    PriceUpdateModeEnum[PriceUpdateModeEnum["entered"] = 2] = "entered";
})(PriceUpdateModeEnum || (exports.PriceUpdateModeEnum = PriceUpdateModeEnum = {}));
exports.priceUpdateModeDatatype = new xtrem_x3_gateway_1.X3EnumDataType({
    enum: PriceUpdateModeEnum,
    filename: __filename,
    localMenuNumber: 220,
});
//# sourceMappingURL=price-update-mode.js.map