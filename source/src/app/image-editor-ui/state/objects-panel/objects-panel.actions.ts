import { ObjectName } from './objects-panel.enum';
import { ObjectPanelItem } from 'app/image-editor/history/objectPanel-item.interface';

export class BlockObject {
    static readonly type = '[Panel] Object blocked';
    constructor(public id: string, public objectId: string, public state: ObjectName, public max: number = 0) {}
}

export class AddObjectPanelItem {
    public static readonly type = '[Object Panel] Add Item';
    constructor(public item: ObjectPanelItem) {}
  }
