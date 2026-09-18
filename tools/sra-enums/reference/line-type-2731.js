"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineType2731Datatype = exports.LineType2731Enum = void 0;
const xtrem_x3_gateway_1 = require("@sage/xtrem-x3-gateway");
var LineType2731Enum;
(function (LineType2731Enum) {
    LineType2731Enum[LineType2731Enum["parentProduct"] = 1] = "parentProduct";
    LineType2731Enum[LineType2731Enum["component"] = 2] = "component";
})(LineType2731Enum || (exports.LineType2731Enum = LineType2731Enum = {}));
exports.lineType2731Datatype = new xtrem_x3_gateway_1.X3EnumDataType({
    enum: LineType2731Enum,
    filename: __filename,
    localMenuNumber: 2731,
});
//# sourceMappingURL=line-type-2731.js.map