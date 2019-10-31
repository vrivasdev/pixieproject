import {ChangeDetectionStrategy, Component, ViewEncapsulation} from '@angular/core';
import {ActiveObjectService} from '../../../../image-editor/canvas/active-object/active-object.service';
import {Store} from '@ngxs/store';
import {AddText} from '../../../state/text/text.actions';
import { GoogleFontsPanelService } from '../../widgets/google-fonts-panel/google-fonts-panel.service';

@Component({
    selector: 'text-drawer',
    templateUrl: './text-drawer.component.html',
    styleUrls: ['./text-drawer.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {'class': 'controls-drawer'},
})
export class TextDrawerComponent {
    constructor(
        private store: Store,
        public activeObject: ActiveObjectService,
        public font: GoogleFontsPanelService
    ) {}

    public addText() {
        this.store.dispatch(new AddText());
    }
    public applyVariant(variant: string) {
        const [fontWeight, fontStyle] = this.getVariantFormat(variant);
        this.activeObject.form.patchValue({
            fontWeight: fontWeight,
            fontStyle: fontStyle
        });
    }
    private getVariantFormat(variant: string): Array<string|number> {
        const variants = variant.split(/(\d+)/);
        let fontStyle: string;
        let fontWeight: string | number;
        
        if (variants[0].length) {
            fontStyle = (variants[0] === 'regular') ? 'normal' : variants[0];
            fontWeight = 'normal';
        } else if (variants[2].length && variants[2] !== 'regular') {
            fontStyle = variants[2];
        } else {
            fontStyle = 'normal';
        }

        if (variants.length > 1) {
            if (variants[1].length) {
                fontWeight = parseInt(variants[1], 0);
            } else {
                fontWeight = 'normal';
            }
        }
        return [fontWeight, fontStyle];
    }
}
