import { Type } from './save.enum';

export class Save {
    static readonly type = '[Save] Design Saved As';
    constructor(public type: Type){}
}