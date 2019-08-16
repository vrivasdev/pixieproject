import {Injectable} from '@angular/core';
import {Keybinds} from 'common/core/keybinds/keybinds.service';
import {ActiveObjectService} from './active-object/active-object.service';
import {CanvasStateService} from './canvas-state.service';
import { Settings } from '../../../common/core/config/settings.service';

@Injectable()
export class CanvasKeybindsService {
    constructor(
        private state: CanvasStateService,
        private keybinds: Keybinds,
        private activeObject: ActiveObjectService,
        private config: Settings
    ) {}

    init() {
        this.state.loaded.subscribe(() => {
            this.keybinds.listenOn(document);

            this.keybinds.add('arrow_up', e => {
                this.maybePreventDefault(e);
                if (this.config.get('pixie.isAdmin')) this.activeObject.move('top', -1);
            });

            this.keybinds.add('arrow_right', e => {
                this.maybePreventDefault(e);
                if (this.config.get('pixie.isAdmin')) this.activeObject.move('left', 1);
            });

            this.keybinds.add('arrow_down', e => {
                this.maybePreventDefault(e);
                if (this.config.get('pixie.isAdmin')) this.activeObject.move('top', 1);
            });

            this.keybinds.add('arrow_left', e => {
                this.maybePreventDefault(e);
                if (this.config.get('pixie.isAdmin')) this.activeObject.move('left', -1);
            });

            this.keybinds.add('delete', e => {
                this.maybePreventDefault(e);
                if (this.activeObject.isEditing()) return;
                if (this.config.get('pixie.isAdmin')) this.activeObject.delete();
            });
        });
    }

    private maybePreventDefault(e: KeyboardEvent) {
        if ( ! e.preventDefault) return;
        if (document.activeElement.tagName.toLowerCase() === 'pixie-editor') {
            e.preventDefault();
        }
    }
}
