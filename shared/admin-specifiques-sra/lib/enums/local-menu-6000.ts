import { X3EnumDataType } from '@sage/xtrem-x3-gateway';

export enum LocalMenu6000Enum {
    substituteValue1 = 1,
    substituteValue2 = 2,
}

export interface LocalMenu6000$EnumInterface {
    substituteValue1: 1;
    substituteValue2: 2;
}

export type LocalMenu6000 = keyof LocalMenu6000$EnumInterface;

export const localMenu6000Datatype = new X3EnumDataType<LocalMenu6000>({
    enum: LocalMenu6000Enum,
    filename: __filename,
    localMenuNumber: 6000,
});
