import { X3EnumDataType } from '@sage/xtrem-x3-gateway';
export declare enum ExchangeRateTypeEnum {
    dailyRate = 1,
    monthlyRate = 2,
    averageRate = 3,
    customsDocFileExchange = 4,
    ueRate = 5
}
export interface ExchangeRateType$EnumInterface {
    dailyRate: 1;
    monthlyRate: 2;
    averageRate: 3;
    customsDocFileExchange: 4;
    ueRate: 5;
}
export type ExchangeRateType = keyof ExchangeRateType$EnumInterface;
export declare const exchangeRateTypeDatatype: X3EnumDataType<keyof ExchangeRateType$EnumInterface, unknown>;
//# sourceMappingURL=exchange-rate-type.d.ts.map