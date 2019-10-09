import {SerializedCanvas} from './serialized-canvas';

export interface ObjectPanelItem extends SerializedCanvas {
    id: string;
    objectId: string;
    state: string;
    max: number;
}