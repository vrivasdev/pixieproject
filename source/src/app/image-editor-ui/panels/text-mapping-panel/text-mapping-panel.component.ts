import { Component, ViewEncapsulation } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
    selector: 'text-mappig-panel',
    templateUrl: './text-mapping-panel.component.html',
    styleUrls:  ['./text-mapping-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class TextMappingPanelComponent {
    public saveForm = new FormGroup({
        mls: new FormControl(),
        profile: new FormControl()
    });
    public save() {
        console.log('___form save___');
    }
}
