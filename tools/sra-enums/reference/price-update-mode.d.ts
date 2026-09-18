import { X3EnumDataType } from '@sage/xtrem-x3-gateway';
export declare enum PriceUpdateModeEnum {
    calculated = 1,
    entered = 2
}
export interface PriceUpdateMode$EnumInterface {
    calculated: 1;
    entered: 2;
}
export type PriceUpdateMode = keyof PriceUpdateMode$EnumInterface;
export declare const priceUpdateModeDatatype: X3EnumDataType<keyof PriceUpdateMode$EnumInterface, unknown>;
//# sourceMappingURL=price-update-mode.d.ts.map