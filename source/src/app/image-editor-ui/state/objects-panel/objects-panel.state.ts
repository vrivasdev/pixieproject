import { Action, NgxsOnInit, State, StateContext } from '@ngxs/store';
import { ObjectName } from './objects-panel.enum';
import { BlockObject } from './objects-panel.actions';

@State({
    name: 'ObjectState',
    defaults: {
        blockedObject: ObjectName.CLEAR
    }
})

export class ObjectPanelState implements NgxsOnInit {
    @Action(BlockObject)
    blockObject(ctx: StateContext, action: BlockObject) {
        ctx.patchState({
            blockedObject: action.object
        })
    }
}