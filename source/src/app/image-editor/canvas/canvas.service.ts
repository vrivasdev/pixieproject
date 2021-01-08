import {Injectable} from '@angular/core';
import {fabric} from 'fabric';
import {Image, Image as FImage, Object} from 'fabric/fabric-impl';
import {Observable} from 'rxjs';
import {CanvasPanService} from './canvas-pan.service';
import {ActiveObjectService} from './active-object/active-object.service';
import {CanvasZoomService} from './canvas-zoom.service';
import {Settings} from 'common/core/config/settings.service';
import {staticObjectConfig} from '../objects/static-object-config';
import {CanvasStateService} from './canvas-state.service';
import {randomString} from '../../../common/core/utils/random-string';
import {Store} from '@ngxs/store';
import { ContentLoaded, 
         SetMlsImage 
} from '../state/editor-state-actions';
import { 
    SetZoomLayer, 
    UpdateZoom,
    UpdateMovement
} from '../state/zoom-state-actions';
import { ZoomState } from '../state/zoom-state'
import {ObjectNames} from '../objects/object-names.enum';
import {normalizeObjectProps} from '../utils/normalize-object-props';
import { rejects } from 'assert';
import { MatDialog } from '@angular/material';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { UpdateObjectId } from '../state/mapping-state-actions';
import { ObjectsService } from 'app/image-editor/objects/objects.service';
import { DialogMessage } from '../../image-editor-ui/dialog/dialog-message/dialog-message';

@Injectable()
export class CanvasService {
    private readonly minWidth: number = 50;
    private readonly minHeight: number = 50;

    constructor(
        public pan: CanvasPanService,
        public zoom: CanvasZoomService,
        public state: CanvasStateService,
        public activeObject: ActiveObjectService,
        private config: Settings,
        private store: Store,
        public dialog: MatDialog,
        private canvasState: CanvasStateService
    ) {}

    public render() {
        this.state.fabric.requestRenderAll();
    }

    public fabric(): fabric.Canvas {
        return this.state.fabric;
    }

    public getObjectById(id: string): Object|null {
        return this.state.fabric.getObjects().find(obj => {
            return obj.data && obj.data.id === id;
        });
    }

    public init(): Observable<any> {
        const canvasEl = document.querySelector('#pixie-canvas') as HTMLCanvasElement;
        this.state.fabric = new fabric.Canvas(canvasEl);

        this.state.fabric.selection = false;
        this.state.fabric.renderOnAddRemove = false;

        const textureSize = this.config.get('pixie.textureSize');
        if (textureSize) fabric['textureSize'] = textureSize;

        const objectDefaults = normalizeObjectProps(
            this.config.get('pixie.objectDefaults')
        );

        for (const key in objectDefaults) {
            fabric.Object.prototype[key] = objectDefaults[key];
        }

        // add ID to all objects
        this.state.fabric.on('object:added', e => {
            if (e.target.data && e.target.data.id) return;
            if ( ! e.target.data) e.target.data = {};
            e.target.data.id = randomString(10);
        });

        this.pan.init();
        this.zoom.init();

        this.initContent().then(() => this.state.loaded.next(null));

        return this.state.loaded;
    }

    public initContent(): Promise<Image|{width: number, height: number}> {
        let image = this.config.get('pixie.image');
        if (image instanceof HTMLImageElement) image = image.src;
        const size = this.config.get('pixie.blankCanvasSize');

        if (image) {
            return this.loadMainImage(image);
        } else if (size) {
            return this.openNew(size.width, size.height);
        }

        return new Promise(resolve => resolve());
    }

    public resize(width: number, height: number) {
        this.state.fabric.setWidth(width * this.zoom.get());
        this.state.fabric.setHeight(height * this.zoom.get());
        this.state.original.width = width;
        this.state.original.height = height;
    }

    public loadMainImage(url: string): Promise<Image> {
        return new Promise(resolve => {
            this.loadImage(url).then(img => {
                this.fabric().clear();
                img.set(staticObjectConfig);
                img.name = ObjectNames.mainImage.name;
                this.state.fabric.add(img);
                this.resize(img.width, img.height);
                this.zoom.fitToScreen();
                this.store.dispatch(new ContentLoaded());
                resolve(img);
                const callback = this.config.get('pixie.onMainImageLoaded');
                if (callback) callback(img);
            });
        });
    }

    public loadImage(data: string): Promise<Image> {
        return new Promise(resolve => {
            fabric.util.loadImage(
                data,
                img => resolve(new fabric.Image(img)),
                null,
                this.config.get('pixie.crossOrigin')
            );
        });
    }

    public replaceImage(active: any, url: string): void {
        if ('_originalElement' in active ) {
            this.fabric().remove(active);
            fabric.util.loadImage(url, img => {
                const newImage = new fabric.Image(img);
                
                newImage.height = active.height;
                newImage.left = active.left;
                newImage.top = active.top;
                newImage.width = active.width;
                newImage.scaleX = active.scaleX;
                newImage.scaleY = active.scaleY;

                this.fabric().add(newImage);
                this.fabric().setActiveObject(newImage);
                this.render();
            });
        }
    }

    public updateProfileImage(active: any, url: string): Promise<string>{
        return new Promise((resolve, reject) => {
            if ('_originalElement' in active ) {
                this.fabric().remove(active);
                fabric.Image.fromURL(url, (img) => {
                    img.set({
                        left: active.left,
                        top: active.top,
                        scaleX: active.scaleX,
                        scaleY: active.scaleY,
                        type: 'image',
                        name: 'image'
                    });
    
                    img.setSrc(url);
                    // resize
                    img.scaleToHeight(active.height * active.scaleY);
                    img.scaleToWidth(active.width * active.scaleX);
    
                    this.fabric().add(img);
                    this.fabric().setActiveObject(img);
    
                    // Update Object ID on mapping state
                    this.store.dispatch(new UpdateObjectId(active.data.id, img.data.id));
                    this.render();

                    resolve(img.data.id.toString());
                });
            } else {
                reject(null);
            }
        })
    }

    public addRectangleImage(obj: any): any {
        let zoomLevel = 1;
        const zoomLevelMin = 0;
        const zoomLevelMax = 2;
        const active = this.fabric().getActiveObject();
        const maxWidth  = this.state.original.width,
        maxHeight = this.state.original.height;
        const step = 0.1;
        const isZoomOut: boolean = false;
        const isZoomIn: boolean = false;
        const patternCanvas = new fabric.StaticCanvas();
        
        patternCanvas.setDimensions({
            width: active.width,
            height: active.height
        });
        
        patternCanvas.add(obj);
        patternCanvas.renderAll();

        const panPoint = new fabric.Point(0, 0);
        const zoomPoint = new fabric.Point(200, 200);
        const pattern = new fabric.Pattern({
            source: () => {
                if (typeof patternCanvas !== 'undefined') {
                    patternCanvas.renderAll();
                    return patternCanvas.getElement();
                }
            },
            repeat: 'no-repeat',
            src: 'currentSrc' in obj._element? obj._element.currentSrc : null
        });

        const rect: any = new fabric.Rect({
            left: active.left,
            top: active.top,
            angle: active.angle,
            width: patternCanvas.getElement().width,
            height: patternCanvas.getElement().height,
            fill: pattern,
            objectCaching: true,
            name: 'image',
            type: 'image'
        });

        rect.scale(1);            

        rect.zoomIn = () => {
            if (zoomLevel < zoomLevelMax) {
                zoomLevel = parseFloat((zoomLevel + step).toFixed(1));                
                patternCanvas.zoomToPoint(zoomPoint, zoomLevel);
            }
            this.store.dispatch( new UpdateZoom(rect.data, zoomLevel));
        };

        rect.zoomOut = () => {
            zoomLevel = parseFloat((zoomLevel - step).toFixed(1));

            if (zoomLevel > 1) zoomLevel = 1;

            if (zoomLevel >= zoomLevelMin) {
                patternCanvas.zoomToPoint(zoomPoint, zoomLevel);
            }
            this.store.dispatch( new UpdateZoom(rect.data, zoomLevel));
        };

        rect.moveImage = (movementX, movementY) => {
            patternCanvas.relativePan(new fabric.Point(movementX, movementY));
            this.store.dispatch(new UpdateMovement(rect.data.id, movementX, movementY));
        }

        const objects = this.fabric().getObjects();         

        this.fabric().remove(active);
    
        rect.enableCache = (isEnable) => {
            rect.objectCaching = isEnable;
        }

        this.state.fabric.add(rect);
        this.state.fabric.setActiveObject(rect);
        
        const newObj = this.fabric().getActiveObject();
        
        this.store.dispatch(new UpdateObjectId(active.data.id,
                                               newObj.data.id));
        
        const allObj = this.fabric().getObjects();
        const position = allObj.findIndex(object => object.data.id === newObj.data.id) - 1;
        
        moveItemInArray(objects, 0, position);

        allObj.find(obj => obj.data.id === allObj[position+1].data.id)
              .moveTo(allObj.length - position - 1);
        
        this.setZoomLayerState(newObj, obj, zoomLevel);
        
        this.canvasState.fabric.requestRenderAll();

        return newObj;
    }

    public addRectangleImagefromURL(obj: any): any {
        const source = 'http://myavex.avantiway.local/' + obj.src;
        fabric.Image.fromURL(source, (img) => {
            img.set({
                left: obj.left,
                top: obj.top,
                scaleX: obj.scaleX,
                scaleY: obj.scaleY,
                type: 'image',
                name: 'image'
            });
            img.setSrc(source);

            let zoomLevel = 5;
            const zoomLevelMin = 1;
            const zoomLevelMax = 5;
            const active = obj;
            const maxWidth  = this.state.original.width,
                maxHeight = this.state.original.height;
            const patternCanvas = new fabric.StaticCanvas();
            const step = 0.5;
            
            // if image is wider or higher then the current canvas, we'll scale it down
            if (obj.width >= maxWidth || obj.height >= maxHeight) {
                // scale newly uploaded image to the above dimensions
                img.scaleX = 0.323;
                img.scaleY = 0.323;
            }
            
            patternCanvas.setDimensions({
                width: active.width,
                height: active.height
            });

            patternCanvas.add(img);
            patternCanvas.renderAll();

            const panPoint = new fabric.Point(0, 0);
            const zoomPoint = new fabric.Point(200, 200);
            const pattern = new fabric.Pattern({
                source: () => {
                    if (typeof patternCanvas !== 'undefined') {
                        patternCanvas.renderAll();
                        return patternCanvas.getElement();
                    }
                },
                repeat: 'no-repeat',
                src: source
            });

            const rect: any = new fabric.Rect({
                left: active.left,
                top: active.top,
                angle: active.angle,
                width: patternCanvas.getElement().width,
                height: patternCanvas.getElement().height,
                fill: pattern,
                objectCaching: true,
                name: 'image',
                type: 'image'
            });

            rect.scale(1);
            patternCanvas.zoomToPoint(zoomPoint, Math.pow(2, obj.zoomLevel));

            rect.zoomIn = () => {
                console.log('___ zoom in ____', zoomLevel);
                if (zoomLevel < zoomLevelMax) {
                    zoomLevel = parseFloat((zoomLevel + step).toFixed(1));                
                    patternCanvas.zoomToPoint(zoomPoint, Math.pow(2, zoomLevel));
                }
                this.store.dispatch( new UpdateZoom(rect.data, zoomLevel));
            };

            rect.zoomOut = () => {
                console.log('___ zoom out ____', zoomLevel);
                if (zoomLevel < 0) zoomLevel = 0;
                if (zoomLevel >= zoomLevelMin) {
                    zoomLevel = parseFloat((zoomLevel - step).toFixed(1));                
                    patternCanvas.zoomToPoint(zoomPoint, Math.pow(2, zoomLevel));
                }
                this.store.dispatch( new UpdateZoom(rect.data, zoomLevel));
            };

            rect.moveImage = (movementX, movementY) => {            
                patternCanvas.relativePan(new fabric.Point(movementX, movementY));
            }

            const objects = this.fabric().getObjects();         

            this.fabric().remove(active);
        
            rect.enableCache = (isEnable) => {
                rect.objectCaching = isEnable;
            }

            this.state.fabric.add(rect);
            this.state.fabric.setActiveObject(rect);
            
            const newObj: any = this.fabric().getActiveObject();

            this.store.dispatch(new UpdateObjectId(active.data.id,
                                                newObj.data.id));

            const allObj = this.fabric().getObjects();
            const position = allObj.findIndex(object => object.data.id === newObj.data.id) - 1;
            
            moveItemInArray(objects, 0, position);

            allObj.find(obj => obj.data.id === allObj[position+1].data.id)
                .moveTo(allObj.length - position -1);
        
            this.setZoomLayerState(newObj, null, obj.zoomLevel);
            
            if ('movementX' in obj && 'movementY' in obj) {
                patternCanvas.relativePan(new fabric.Point(obj.movementX, obj.movementY));
                this.store.dispatch(new UpdateMovement(newObj.data.id, obj.movementX, obj.movementY));
            }
            // MLS Image variable's state as true
            this.store.dispatch(new SetMlsImage(true));
            this.canvasState.fabric.requestRenderAll();
        });
    }

    private setZoomLayerState(obj: any, oldObj: any = null, zoomLevel: number): void {
        this.store.dispatch(new SetZoomLayer(
            obj.data,
            zoomLevel,
            obj.fill.src,
            oldObj? oldObj.scaleX : obj.scaleX,
            oldObj? oldObj.scaleY : obj.scaleY,
            obj.width,
            obj.height,
            obj.left,
            obj.top,
            obj.angle,
            obj.name,
            obj.type,
            oldObj? oldObj.movementX : obj.movementX,
            oldObj? oldObj.movementY : obj.movementY,
        ));
    }
    /**
     * Create a blank canvas with specified dimensions.
     */
    public openNew(width: number, height: number): Promise<{width: number, height: number}> {
        width = width < this.minWidth ? this.minWidth : width;
        height = height < this.minHeight ? this.minHeight : height;

        this.state.fabric.clear();
        this.resize(width, height);

        return new Promise(resolve => {
            setTimeout(() => {
                this.zoom.fitToScreen();
                this.store.dispatch(new ContentLoaded());
                resolve({width, height});
            });
        });
    }

    /**
     * Open image at given url in canvas.
     */
    public openImage(url, validate:boolean = false, rectBorder: boolean = false): Promise<Image> {
        return new Promise((resolve, reject) => {
            fabric.util.loadImage(url, image => {
                if ( ! image) return;

                const object = new fabric.Image(image);
                const active = this.fabric().getActiveObject();

                if (!this.config.get('pixie.isAdmin')) {
                    if (validate && (object.height < active.height) || (object.width < active.width)) {
                        this.openDialog(`Image must have this resolution: ${active.width} x ${active.height}`, true);
                    }
                }
                resolve(rectBorder? this.addRectangleImage(object):this.addImage(object));
            });
        });
    }

   public openDialog(message: string, error: boolean = false): void {
        this.dialog.open(DialogMessage, {
            width: '250px',
            data: {message: message, errorFound: error}
        });
    }

    public addImage(object: any): any {
        object.name = ObjectNames.image.name;
        // use either main image or canvas dimensions as outter boundaries for scaling new image
        const maxWidth  = this.state.original.width,
            maxHeight = this.state.original.height;
        
        // if image is wider or higher then the current canvas, we'll scale it down
        if (object.width >= maxWidth || object.height >= maxHeight) {

            // calc new image dimensions (main image height - 10% and width - 10%)
            const newWidth  = maxWidth - (0.1 * maxWidth),
                newHeight = maxHeight - (0.1 * maxHeight),
                scale     = 1 / (Math.min(newHeight / object.getScaledHeight(), newWidth / object.getScaledWidth()));

            // scale newly uploaded image to the above dimensions
            object.scaleX = object.scaleX * (1 / scale);
            object.scaleY = object.scaleY * (1 / scale);
        }

        // center and render newly uploaded image on the canvas
        this.state.fabric.add(object);
        object.viewportCenter();
        object.setCoords();
        this.render();
        this.zoom.fitToScreen();

        return object;
    }

    /**
     * Get main image object, if it exists.
     */
    public getMainImage(): FImage {
        return this.state.fabric.getObjects()
            .find(obj => obj.name === ObjectNames.mainImage.name) as FImage;
    }

    public getZoomLevel(id: string): number | null {
        return this.zoom.getZoomLevelById(id);
    }
}
