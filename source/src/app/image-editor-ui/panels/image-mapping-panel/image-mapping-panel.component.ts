import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Store } from '@ngxs/store';
import { ActiveObjectService } from 'app/image-editor/canvas/active-object/active-object.service';
import { SetMapping } from 'app/image-editor/state/mapping-state-actions';
import { MappingType } from 'app/image-editor/state/mapping-type.enum';
import { Map } from 'app/image-editor/state/map.enum';

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

    public selectedType = 'mls';

    public clearSelector(event, selector) {
        this.saveForm.patchValue(selector === 'mls' ? {mls: ''} : {profile: ''});
    }

    public save() {
        this.store.dispatch(new SetMapping(this.activeObject.get().data.id,
                                           this.saveForm.value.type === 'mls' ? MappingType.MLS : MappingType.PROFILE,
                                           this.saveForm.value.type,
                                           Map.IMAGE));
    }
}
