import { Component, ViewEncapsulation } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Store } from '@ngxs/store';
import { ActiveObjectService } from 'app/image-editor/canvas/active-object/active-object.service';
import { SetMapping } from 'app/image-editor/state/mapping-state-actions';
import { MappingType } from 'app/image-editor/state/mapping-type.enum';
import { FloatingPanelsService } from 'app/image-editor-ui/toolbar-controls/floating-panels.service';

@Component({
    selector: 'text-mappig-panel',
    templateUrl: './text-mapping-panel.component.html',
    styleUrls:  ['./text-mapping-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class TextMappingPanelComponent {
    
    constructor(private store: Store,
                private activeObject: ActiveObjectService,
                private floatingPanel: FloatingPanelsService
                ) {}

    public saveForm = new FormGroup({
        mls: new FormControl(),
        profile: new FormControl()
    });

    public clearSelector(event, selector) {
        this.saveForm.patchValue(selector === 'mls' ? {mls: ''} : {profile: ''});
    }

    public save() {
        const {field, type} = this.saveForm.value.mls ? { 'field': this.saveForm.value.mls, 'type': MappingType.MLS}
                                                      : { 'field': this.saveForm.value.profile, 'type': MappingType.PROFILE};
        this.store.dispatch(new SetMapping(this.activeObject.get().data.id, type, field));
        //this.floatingPanel.closePanel('dialog');
    }
}
