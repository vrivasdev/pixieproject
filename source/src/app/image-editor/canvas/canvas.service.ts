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
import {ContentLoaded} from '../state/editor-state-actions';
import {ObjectNames} from '../objects/object-names.enum';
import {normalizeObjectProps} from '../utils/normalize-object-props';
import { rejects } from 'assert';
import { MatDialog } from '@angular/material';
import { DialogMessage } from '../../image-editor-ui/dialog/dialog-message/dialog-message';
import { UpdateObjectId } from '../state/mapping-state-actions';

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
    public openImage(url, validate:boolean = false): Promise<Image> {
        return new Promise((resolve, reject) => {
            fabric.util.loadImage(url, image => {
                if ( ! image) return;

                const object = new fabric.Image(image);
                const active = this.fabric().getActiveObject();

                if (!this.config.get('pixie.isAdmin')) {
                    if (active){
                        if (validate && (object.height < active.height) || (object.width < active.width)) {
                            this.openDialog(`Image must have this resolution: ${active.width} x ${active.height}`, 
                                            true);
                            reject(object);
                        } else {
                            if (validate) this.openDialog(`For better results image should have this resolution ${active.width} x ${active.height}`);
                            resolve(this.addImage(object));
                        }
                    } else {
                        if (validate) this.openDialog(`For better results image should have this resolution ${active.width} x ${active.height}`);
                        resolve(this.addImage(object));
                    }
                } else {
                    resolve(this.addImage(object));
                }
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
}
