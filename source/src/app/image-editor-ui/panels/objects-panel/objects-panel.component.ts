import {ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import {ObjectsService} from '../../../image-editor/objects/objects.service';
import {OverlayPanelRef} from 'common/core/ui/overlay-panel/overlay-panel-ref';
import {Object} from 'fabric/fabric-impl';
import {EditorControlsService} from '../../toolbar-controls/editor-controls.service';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {CanvasStateService} from '../../../image-editor/canvas/canvas-state.service';
import {Select, Store} from '@ngxs/store';
import {EditorState} from '../../../image-editor/state/editor-state';
import {OpenPanel} from '../../../image-editor/state/editor-state-actions';
import {DrawerName} from '../../toolbar-controls/drawers/drawer-name.enum';
import {ObjectNames} from '../../../image-editor/objects/object-names.enum';
import {Observable} from 'rxjs';
import { BlockObject } from 'app/image-editor-ui/state/objects-panel/objects-panel.actions';
import { ObjectName } from 'app/image-editor-ui/state/objects-panel/objects-panel.enum';
import { ObjectPanelState, ObjectsPanelStateModel } from 'app/image-editor-ui/state/objects-panel/objects-panel.state';
import {Settings} from 'common/core/config/settings.service';
import { ActiveObjectService } from 'app/image-editor/canvas/active-object/active-object.service';
import { HistoryToolService } from 'app/image-editor/history/history-tool.service';
import { MappingState } from 'app/image-editor/state/mapping-state';
import { ObjectsState } from 'app/image-editor-ui/state/objects/objects.state';

enum ImageType{
    MLS = 'Main Property Image',
    PROFILE = 'Agent Profile Image',
    OTHER = 'Template Locked Image'
}

@Component({
    selector: 'objects-panel',
    templateUrl: './objects-panel.component.html',
    styleUrls: ['./objects-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class ObjectsPanelComponent {
    @Select(EditorState.activeObjId) activeObjId$: Observable<string>;
    @Select(ObjectPanelState.blockedObject) blockedObject$: Observable<ObjectsPanelStateModel>;

    public isAdmin: boolean;

    constructor(
        public objects: ObjectsService,
        public panelRef: OverlayPanelRef,
        private controls: EditorControlsService,
        private canvasState: CanvasStateService,
        private store: Store,
        private config: Settings,
        private active: ActiveObjectService,
        private history: HistoryToolService,
    ) {
        this.isAdmin = config.get('pixie.isAdmin');
    }

    public getIcon(object: Object): string {
        return ObjectNames[object.name].icon;
    }

    public selectObject(object: Object) {
        this.objects.select(object);
        if ( ! this.store.selectSnapshot(EditorState.dirty)) {
            this.store.dispatch(new OpenPanel(DrawerName.OBJECT_SETTINGS));
        }
    }

    public openInput(object: Object) {
        this.objects.setRename(object.data.id, true);
    }

    public isRename(object: Object) {
        return this.objects.isRename(object.data.id);
    }

    public updateName(object: Object, event: Event) {
        this.objects.setName(object.data.id, event.target['value']);
        this.objects.setRename(object.data.id, false);
    }

    public blockSelectedObject(object: Object, type: string) {
        switch (type) {
            case 'textsize':
                this.store.dispatch(new BlockObject(object.data.id + ObjectName.TEXTSIZE.charAt(0).toLowerCase(),
                                                    object.data.id, ObjectName.TEXTSIZE));
            break;
            case 'style':
                this.store.dispatch(new BlockObject(object.data.id + ObjectName.STYLE.charAt(0).toLowerCase(),
                                                    object.data.id, ObjectName.STYLE));
            break;
            case 'color':
                this.store.dispatch(new BlockObject(object.data.id + ObjectName.COLOR.charAt(0).toLowerCase(),
                                                    object.data.id, ObjectName.COLOR));
            break;
            case 'image':
                this.store.dispatch(new BlockObject(object.data.id + ObjectName.IMAGE.charAt(0).toLowerCase(),
                                                    object.data.id, ObjectName.IMAGE));
            break;
            case 'size':
                this.blockScaling(object);
            break;
            case 'position':
                this.blockMovement(object);
            break;
            case 'maxtext':
                let obj: any = object;
                this.store.dispatch(new BlockObject(obj.data.id + ObjectName.MAXTEXT.charAt(0).toLowerCase(),
                                                    obj.data.id, ObjectName.MAXTEXT,  obj.text.length));
            break;
            case 'xmappingtext':
                this.store.dispatch(new BlockObject(object.data.id + ObjectName.MAPPINGTEXT.charAt(0).toLowerCase(),
                                                    object.data.id, ObjectName.MAPPINGTEXT));
            break;
            case 'ymappingimage':
                this.store.dispatch(new BlockObject(object.data.id + ObjectName.MAPPINGIMAGE.charAt(0).toLowerCase(),
                                                    object.data.id, ObjectName.MAPPINGIMAGE));
            break;
        }
    }

    private blockScaling(object: Object) {
        object.lockScalingX  = object.lockScalingX ? false : true;
        object.lockScalingY  = object.lockScalingY ? false : true;
    }

    private blockMovement(object: Object) {
      object.lockMovementX = object.lockMovementX ? false : true;
      object.lockMovementY = object.lockMovementY ? false : true;
      object.lockRotation  = object.lockRotation ? false : true;
    }

    public getObjectDisplayName(object: any): string {
        const name = 'rename' in object ? object['rename'] : object.name;
        const text = name ? name.replace(/([A-Z])/g, ' $1') : '';

        if (!this.config.get('pixie.isAdmin')){
            if (object.type === 'i-text') {
                const words = object.text.split(" ");
                return words.length >= 2 ? `${words[0]} ${words[1]} ...` : object.text;
            } else if (object.type === 'image') {
                const mappedObjects = this.store.selectSnapshot(MappingState.getMappingObjects);
                if (mappedObjects.length) {
                    if (mappedObjects.some(obj => obj.objectId === object.data.id)){
                        if (mappedObjects.some(obj => (obj.objectId === object.data.id) && obj.type === 'mls')) {
                            return ImageType.MLS;
                        } else {
                            return ImageType.PROFILE;
                        }
                    } else {
                        return ImageType.OTHER;
                    }
                }
            }
        }
        return text;
    }

    public reorderObjects(e: CdkDragDrop<string>) {
        if (!this.config.get('pixie.isAdmin')) return;
        
        moveItemInArray(this.objects.getAll(), e.previousIndex, e.currentIndex);
        // pixie and canvas object orders are reversed, need to
        // reverse newIndex given by cdk drag and drop
        const index = this.objects.getAll()
            .slice().reverse().findIndex(obj => obj.data.id === e.item.data);
        
        this.objects.getById(e.item.data).moveTo(index);
        this.canvasState.fabric.requestRenderAll();
    }

    public shouldDisableObject(object: Object): boolean {
        return !object.selectable && object.name !== ObjectNames.drawing.name;
    }

    public getImageUrl(url: string) {
      return this.config.getAssetUrl(url);
    }

    public isBlocked(object: Object): boolean {
        if (!this.config.get('pixie.isAdmin')) {
            const name = 'rename' in object ? object['rename'] : object.name;

            if (!this.config.get('pixie.isAdmin')){
                if (object.type === 'i-text') {
                    return false;
                } else if (object.type === 'image') {
                    const mappedObjects = this.store.selectSnapshot(MappingState.getMappingObjects);
                    if (mappedObjects.length) {
                        if (mappedObjects.some(obj => obj.objectId === object.data.id)){
                            if (mappedObjects.some(obj => (obj.objectId === object.data.id) && obj.type === 'mls')) {
                                return false;
                            } else {
                                return false;
                            }
                        } else {
                            return true
                        }
                    }
                }
            }
            return false;
        }
    }
}
