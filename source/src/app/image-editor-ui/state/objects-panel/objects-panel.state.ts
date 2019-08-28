import { Action, State, StateContext, Store, Selector } from '@ngxs/store';
import { ObjectName } from './objects-panel.enum';
import { BlockObject } from './objects-panel.actions';

export interface ObjectsPanelStateModel {
    blockedObject: ObjectName;
}

@State({
    name: 'ObjectState',
    defaults: {
        blockedObject: ObjectName.CLEAR
    }
})

export class ObjectPanelState {
    @Selector()
    static blockedObject(state: ObjectsPanelStateModel) {
        return state.blockedObject;
    }

    constructor(private store: Store) {}

    @Action(BlockObject)
    BlockObject(ctx: StateContext<ObjectsPanelStateModel>, action: BlockObject) {
        ctx.patchState({
            blockedObject: (ctx.getState().blockedObject === 'clear') ? action.object : ObjectName.CLEAR
        });
    }
}
