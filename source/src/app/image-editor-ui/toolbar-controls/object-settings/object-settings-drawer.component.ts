import {ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import {ActiveObjectService} from '../../../image-editor/canvas/active-object/active-object.service';
import {HistoryToolService} from '../../../image-editor/history/history-tool.service';
import {Select, Store} from '@ngxs/store';
import {Observable, Subscription} from 'rxjs';
import {MarkAsDirty, OpenObjectSettingsPanel} from '../../state/objects/objects.actions';
import {ObjectsState} from '../../state/objects/objects.state';
import {take} from 'rxjs/operators';
import {EditorState} from '../../../image-editor/state/editor-state';
import { ObjectPanelState, ObjectsPanelStateModel } from '../../state/objects-panel/objects-panel.state';
import { ImportToolService } from 'app/image-editor/tools/import/import-tool.service';
import { CanvasService } from 'app/image-editor/canvas/canvas.service';
import {HistoryNames} from '../../../image-editor/history/history-names.enum';
import { FloatingPanelsService } from '../floating-panels.service';

@Component({
    selector: 'object-settings-drawer',
    templateUrl: './object-settings-drawer.component.html',
    styleUrls: ['./object-settings-drawer.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {'class': 'controls-drawer'},
})
export class ObjectSettingsDrawerComponent implements OnInit, OnDestroy {
    @Select(ObjectsState.activePanel) activePanel$: Observable<string>;
    @Select(EditorState.activeObjIsText) activeObjIsText$: Observable<boolean>;
    @Select(EditorState.activeObjIsShape) activeObjIsShape$: Observable<boolean>;
    @Select(ObjectPanelState.blockedObject) blockedObject$: Observable<ObjectsPanelStateModel>;

    private subscription: Subscription;
    public type: String;

    constructor(
        public activeObject: ActiveObjectService,
        protected history: HistoryToolService,
        private store: Store,
        private importTool: ImportToolService,
        private canvas: CanvasService,
        public panels: FloatingPanelsService,
    ) {}

    ngOnInit() {
        this.subscription = this.activeObject.propsChanged$
            .pipe(take(1))
            .subscribe(() => {
                this.store.dispatch(new MarkAsDirty());
            });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    public openPanel(name: string) {
        this.store.dispatch(new OpenObjectSettingsPanel(name));
    }

    public imageUpdate() {
        this.importTool.openUploadDialog().then(obj => {
            let active;
            
            if ( ! obj) return;

            active = this.canvas.fabric().getActiveObject();

            obj.height = active.height;
            obj.left = active.left;
            obj.top = active.top;
            obj.width = active.width;
            obj.scaleX = active.scaleX;
            obj.scaleY = active.scaleY;

            this.canvas.fabric().remove(active);

            this.canvas.fabric().setActiveObject(obj);
            this.history.add(HistoryNames.OVERLAY_IMAGE);
        });
    }

    public textMappingModal() {
        this.panels.openTextMappingPanel();
    }
}
