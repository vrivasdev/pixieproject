import {ChangeDetectionStrategy, Component, ViewEncapsulation} from '@angular/core';
import {ActiveObjectService} from '../../../../image-editor/canvas/active-object/active-object.service';
import {MatButtonToggleChange, MatSelectModule, MatOptionModule } from '@angular/material';
import { GoogleFontsPanelService } from '../../widgets/google-fonts-panel/google-fonts-panel.service';

@Component({
    selector: 'text-controls-drawer',
    templateUrl: './text-controls-drawer.component.html',
    styleUrls: ['./text-controls-drawer.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextControlsDrawerComponent {
    constructor(
        public activeObject: ActiveObjectService,
        public font: GoogleFontsPanelService
    ) {}

    public setTextStyle(e: MatButtonToggleChange) {
        this.activeObject.form.patchValue({
            underline: e.value.indexOf('underline') > -1,
            linethrough: e.value.indexOf('linethrough') > -1,
            fontStyle: e.value.indexOf('italic') > -1 ? 'italic' : 'normal',
            fontWeight: e.value.indexOf('bold') > -1 ? 'bold' : 'normal'
        });
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

    public setAlignment(e: MatButtonToggleChange) {
        const obj: any = this.activeObject.get();
        let sing: number; 

        if (e.value === 'right' || e.value === 'center' || 
           (e.value === 'left' && obj.originX !== 'left' )) {
            obj.set({originX:e.value});
            
            if (e.value === 'left') sing = -1;
            else if (e.value === 'right' || e.value === 'center') sing = 1;

            obj.set({left: obj.left + (sing)*(obj.aCoords.tr.x - obj.aCoords.tl.x)})
        }
    }
}