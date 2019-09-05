import { Store } from '@ngxs/store';
import { Component } from '@angular/core';
import { ActiveObjectService } from 'app/image-editor/canvas/active-object/active-object.service';

@Component({
    selector: 'image-drawer',
    templateUrl: './image-drawer.component.html',
    styleUrls: ['./image-drawer.component.scss']
})
export class ImageDrawerComponent {
    constructor(
        private store: Store,
        public activeObject: ActiveObjectService
    ) {}
}
