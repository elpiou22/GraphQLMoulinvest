"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangeRateTypeDatatype = exports.ExchangeRateTypeEnum = void 0;
const xtrem_x3_gateway_1 = require("@sage/xtrem-x3-gateway");
var ExchangeRateTypeEnum;
(function (ExchangeRateTypeEnum) {
    ExchangeRateTypeEnum[ExchangeRateTypeEnum["dailyRate"] = 1] = "dailyRate";
    ExchangeRateTypeEnum[ExchangeRateTypeEnum["monthlyRate"] = 2] = "monthlyRate";
    ExchangeRateTypeEnum[ExchangeRateTypeEnum["averageRate"] = 3] = "averageRate";
    ExchangeRateTypeEnum[ExchangeRateTypeEnum["customsDocFileExchange"] = 4] = "customsDocFileExchange";
    ExchangeRateTypeEnum[ExchangeRateTypeEnum["ueRate"] = 5] = "ueRate";
})(ExchangeRateTypeEnum || (exports.ExchangeRateTypeEnum = ExchangeRateTypeEnum = {}));
exports.exchangeRateTypeDatatype = new xtrem_x3_gateway_1.X3EnumDataType({
    enum: ExchangeRateTypeEnum,
    filename: __filename,
    localMenuNumber: 202,
});
//# sourceMappingURL=exchange-rate-type.js.map