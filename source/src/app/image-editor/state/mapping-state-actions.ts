import { MappingType } from './mapping-type.enum';

export class SetMapping {
    static readonly type = '[Editor] Set Mapping value';
    constructor(public objectId: String, public type: MappingType, public field: String) {}
}