import { Text } from './../../../fabric-types/fabric-impl.d';
import {ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation, HostListener} from '@angular/core';
import {CanvasService} from '../image-editor/canvas/canvas.service';
import {HistoryToolService} from '../image-editor/history/history-tool.service';
import {fromEvent, Observable, BehaviorSubject} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {EditorControlsService} from './toolbar-controls/editor-controls.service';
import {FloatingPanelsService} from './toolbar-controls/floating-panels.service';
import {CanvasKeybindsService} from '../image-editor/canvas/canvas-keybinds.service';
import {ActiveObjectService} from '../image-editor/canvas/active-object/active-object.service';
import {CanvasStateService} from '../image-editor/canvas/canvas-state.service';
import {Settings} from 'common/core/config/settings.service';
import {BreakpointsService} from '../../common/core/ui/breakpoints.service';
import {Select, Store} from '@ngxs/store';
import {ObjectDeselected, ObjectSelected, OpenPanel} from '../image-editor/state/editor-state-actions';
import {EditorState} from '../image-editor/state/editor-state';
import {ControlPosition} from '../image-editor/enums/control-positions.enum';
import {DrawerName} from './toolbar-controls/drawers/drawer-name.enum';
import {Localization} from '../../common/core/types/models/Localization';
import {Translations} from '../../common/core/translations/translations.service';
import { ObjectPanelState } from './state/objects-panel/objects-panel.state';
import { ImportToolService } from 'app/image-editor/tools/import/import-tool.service';
import {delay} from 'rxjs/operators';
import { TextMappingService } from 'app/image-editor/tools/mapping/text-mapping.service';
import { MappingState } from 'app/image-editor/state/mapping-state';
import { UpdateObjectId } from 'app/image-editor/state/mapping-state-actions';
import { MatDialog } from '@angular/material';
import { DialogMessage } from './dialog/dialog-message/dialog-message';
import { DialogQuestion } from './dialog/dialog-question/dialog-question';
import {moveItemInArray} from '@angular/cdk/drag-drop';
import { ObjectsService } from 'app/image-editor/objects/objects.service';

@Component({
    selector: 'image-editor',
    templateUrl: './image-editor.component.html',
    styleUrls: ['./image-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class ImageEditorComponent implements OnInit {
    private isAdmin: boolean;
    @Select(EditorState.controlsPosition) controlsPosition$: Observable<ControlPosition>;
    @Select(EditorState.toolbarHidden) toolbarHidden$: Observable<boolean>;
    @Select(EditorState.contentLoaded) contentLoaded$: Observable<boolean>;
    @ViewChild('canvasWrapper') canvasWrapper: ElementRef;
    @ViewChild('canvasMaskWrapper') canvasMaskWrapper: ElementRef;
    public compactMode = new BehaviorSubject(false);
    constructor(
        public canvas: CanvasService,
        private history: HistoryToolService,
        public controls: EditorControlsService,
        public breakpoints: BreakpointsService,
        private floatingPanels: FloatingPanelsService,
        private canvasKeybinds: CanvasKeybindsService,
        private el: ElementRef,
        private activeObject: ActiveObjectService,
        private state: CanvasStateService,
        private objectPanelState: ObjectPanelState,
        public config: Settings,
        private store: Store,
        private i18n: Translations,
        private importToolService: ImportToolService,
        private mappingService: TextMappingService,
        public dialog: MatDialog,
        public objects: ObjectsService,
        private canvasState: CanvasStateService
    ) {
        this.isAdmin = config.get('pixie.isAdmin');
    }

    ngOnInit() {
        this.state.wrapperEl = this.canvasWrapper.nativeElement;
        this.state.maskWrapperEl = this.canvasMaskWrapper.nativeElement;

        // update editor language on settings change
        this.setLocalization();
        this.config.onChange.subscribe(() => {
            this.setLocalization();
        });

        this.canvas.init().subscribe(() => {
            this.activeObject.init();
            this.canvasKeybinds.init();
            this.fitCanvasToScreenOnResize();
            this.openObjectSettingsOnDoubleClick();
            this.closePanelsOnObjectDelete();
            this.handleObjectSelection();
            this.updateHistoryOnObjectModification();
            this.canvasMaskWrapper.nativeElement.classList.remove('not-loaded');
        });
    }

    private loadBackground() {
        this.importToolService.loadBackground();
    }

    private loadJson() {
        this.importToolService.loadJson();
    }

    private loadDataImage(image): any {
        return fetch(image).then(response => response.blob())
                    .then(blob => new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    }));
    }
    
    private closePanelsOnObjectDelete() {
        this.canvas.fabric().on('object:delete', () => this.controls.closeCurrentPanel());
    }

    private openObjectSettingsOnDoubleClick() {
        this.canvas.fabric().on('mouse:dblclick', () => {
            if (!this.activeObject.getId() || this.store.selectSnapshot(EditorState.dirty) || !this.config.get('pixie.isAdmin')) return;
            this.store.dispatch(new OpenPanel(DrawerName.OBJECT_SETTINGS));
        });
    }

    /**
     * Replace current history item, so object position is
     * updated after object is scaled, moved or rotated.
     */
    private updateHistoryOnObjectModification() {
        this.canvas.fabric().on('object:modified', event => {
            if (!event.e || this.store.selectSnapshot(EditorState.dirty)) return;
            this.history.replaceCurrent();
        });
    }

    private handleObjectSelection() {
        this.canvas.fabric().on('selection:created', e => this.onObjectSelection(e));
        this.canvas.fabric().on('selection:updated', e => this.onObjectSelection(e));
    }

    public onObjectSelection(fabricEvent) {
        const mappedObjects = this.store.selectSnapshot(MappingState.getMappingObjects);
        const exist = mappedObjects.some(object => object.objectId === fabricEvent.target.data.id)

        this.store.dispatch(new ObjectSelected(
            fabricEvent.target.name, fabricEvent.e != null &&
            this.config.get('pixie.isAdmin')
        ));
    }
    
    private fitCanvasToScreenOnResize() {
        fromEvent(window, 'resize')
            .pipe(debounceTime(200), distinctUntilChanged())
            .subscribe(() => {
                this.canvas.zoom.fitToScreen();
            });
    }

    private setLocalization() {
        const active = this.config.get('pixie.languages.active', 'default');
        if (active === 'default') return;

        this.config.set('i18n.enable', true);
        const lines = this.config.get(`pixie.languages.custom.${active}`);

        this.i18n.setLocalization({
            model: new Localization({name: active}),
            lines: lines,
        });
    }
    /**
     * Listen keydown event when user is writting down any new text
     * @param event keydown event
     */
    @HostListener('window:keydown', ['$event'])
    keyevent(event: KeyboardEvent) {
        const blockedObject = this.store.selectSnapshot(ObjectPanelState.blockedObject);
        const maxTextObject = this.store.selectSnapshot(ObjectPanelState.maxTextObject);
        const obj: any = this.activeObject.get();
        
        if (obj) {
            if ('data' in obj) {
                if (blockedObject[obj.data.id + 'm'] === 'maxtext' &&
                 (this.activeObject.get().toObject().text.length >= maxTextObject[obj.data.id + 'm']) &&+-
                 ((event.key !== 'Backspace'))) {
                  event.preventDefault();
                  event.stopPropagation();
                  return false;
                }
            }
        }
        if (!this.config.get('pixie.getAdmin')) {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                if (event.key === 'ArrowRight') obj.cropX += 20;
                else if (event.key === 'ArrowLeft') obj.cropX -= 20;
    
                this.canvasState.fabric.requestRenderAll();
            }
        }   
    }

    @HostListener('document:keydown.control.v', ['$event'])
    onPaste(event: KeyboardEvent) {
        const blockedObject = this.store.selectSnapshot(ObjectPanelState.blockedObject);
        const maxTextObject = this.store.selectSnapshot(ObjectPanelState.maxTextObject);
        const obj = this.activeObject.get();
        const nav: any = navigator;

        if ('clipboard' in navigator) {
            nav.clipboard.readText().then(text => {
                if ((blockedObject[obj.data.id + 'm'] === 'maxtext') &&
                ((text.length + this.activeObject.get().toObject().text.length) >= maxTextObject[obj.data.id + 'm'] )) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
            }).catch(error => console.log('Error:', error));
        }
    }
    // if agent double clicks on any layer maped as image
    @HostListener('dblclick', ['$event.target'])
    doubleClick(event: MouseEvent) {
        if (!this.config.get('pixie.isAdmin')) {

            const active: any = this.activeObject.get();
            const mappedObjects = this.store.selectSnapshot(MappingState.getMappingObjects);

            if (active.type === 'image' && 
                mappedObjects.some(object => object.objectId === active.data.id)) {
                    
                    const dialogRef  = this.dialog.open(DialogQuestion, {
                        width: '300px',
                        data: {message: 'Are you sure you want to upload an image?'}
                    });
                    
                    dialogRef.afterClosed().subscribe(upload => {
                        if (upload) {
                            this.importToolService
                            .openUploadDialog({validate: true})
                            .then(obj => {
                                const active = this.canvas.fabric().getActiveObject();
                                const position = this.objects.getAll().findIndex(obj => obj.data.id === active.data.id);

                                if ( ! obj) return;

                                obj.height = active.height;
                                obj.left = active.left;
                                obj.top = active.top;
                                obj.width = active.width;
                                obj.scaleX = active.scaleX;
                                obj.scaleY = active.scaleY;
        
                                this.canvas.fabric().remove(active);
                                this.canvas.fabric().setActiveObject(obj);
        
                                this.store.dispatch(new UpdateObjectId(active.data.id, obj.data.id));
                                moveItemInArray(this.objects.getAll(), 0, position);
                                const index = this.objects.getAll()
                                                  .slice().reverse().findIndex(obj => obj.data.id === obj.data.id);
                                
                                const allObj = this.objects.getAll();
                                
                                this.objects.getById(allObj[position].data.id).moveTo(allObj.length - position -1);
                                this.canvasState.fabric.requestRenderAll();
                            });
                        }
                    });
            }
        }
    }
    // if agent clicks on canvas
    @HostListener('click', ['$event.target'])
    onClick(event: MouseEvent) {
        if (!this.config.get('pixie.isAdmin')) {
            const element:any = event;
            if (element.tagName === 'CANVAS') {
                if (!this.floatingPanels.panelIsOpen('objects')) {
                    this.floatingPanels.toggleObjects();
                }
            }
        }
    }
}
