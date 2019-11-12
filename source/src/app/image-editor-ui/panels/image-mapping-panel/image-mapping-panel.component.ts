import { Component, ViewEncapsulation } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Store } from '@ngxs/store';
import { ActiveObjectService } from 'app/image-editor/canvas/active-object/active-object.service';
import { SetMapping } from 'app/image-editor/state/mapping-state-actions';
import { MappingType } from 'app/image-editor/state/mapping-type.enum';

@Component({
    selector: 'image-mappig-panel',
    templateUrl: './image-mapping-panel.component.html',
    styleUrls:  ['./image-mapping-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class ImageMappingPanelComponent {
    
    constructor(private store: Store,
                private activeObject: ActiveObjectService) {}

    public saveForm = new FormGroup({
        type: new FormControl(),
    });

    public selected = 'mls';

    public clearSelector(event, selector) {
        this.saveForm.patchValue(selector === 'mls' ? {mls: ''} : {profile: ''});
    }

    public save() {
        console.log('Type:', this.saveForm.value.type);
        /*const {field, type} = this.saveForm.value.mls ? { 'field': this.saveForm.value.mls, 'type': MappingType.MLS}
                                                      : { 'field': this.saveForm.value.profile, 'type': MappingType.PROFILE};
        this.store.dispatch(new SetMapping(this.activeObject.get().data.id, type, field));*/
    }
}
