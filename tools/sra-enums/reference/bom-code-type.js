"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bomCodeTypeDatatype = exports.BomCodeTypeEnum = void 0;
const xtrem_x3_gateway_1 = require("@sage/xtrem-x3-gateway");
var BomCodeTypeEnum;
(function (BomCodeTypeEnum) {
    BomCodeTypeEnum[BomCodeTypeEnum["salesKit"] = 1] = "salesKit";
    BomCodeTypeEnum[BomCodeTypeEnum["manufacturing"] = 2] = "manufacturing";
    BomCodeTypeEnum[BomCodeTypeEnum["subcontracting"] = 3] = "subcontracting";
})(BomCodeTypeEnum || (exports.BomCodeTypeEnum = BomCodeTypeEnum = {}));
exports.bomCodeTypeDatatype = new xtrem_x3_gateway_1.X3EnumDataType({
    enum: BomCodeTypeEnum,
    filename: __filename,
    localMenuNumber: 224,
});
//# sourceMappingURL=bom-code-type.js.map