import { X3EnumDataType } from '@sage/xtrem-x3-gateway';
export declare enum BomCodeTypeEnum {
    salesKit = 1,
    manufacturing = 2,
    subcontracting = 3
}
export interface BomCodeType$EnumInterface {
    salesKit: 1;
    manufacturing: 2;
    subcontracting: 3;
}
export type BomCodeType = keyof BomCodeType$EnumInterface;
export declare const bomCodeTypeDatatype: X3EnumDataType<keyof BomCodeType$EnumInterface, unknown>;
//# sourceMappingURL=bom-code-type.d.ts.map