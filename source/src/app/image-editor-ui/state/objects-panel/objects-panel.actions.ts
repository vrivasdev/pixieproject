import { ObjectName } from './objects-panel.enum';

export class BlockObject {
    static readonly type = '[Panel] Object blocked';
    constructor(public object: ObjectName) {}
}