import { MappingType } from './mapping-type.enum';
import { Map } from './map.enum';

export class SetMapping {
    static readonly type = '[Editor] Set Mapping value';
    constructor(public objectId: String, public type: MappingType, public field: String, public map: Map) {}
}