import {Injectable} from '@angular/core';
import {CanvasService} from '../../canvas/canvas.service';
import {CropZoneService} from '../crop/crop-zone.service';
import {HistoryToolService} from '../../history/history-tool.service';
import { saveAs } from 'file-saver';
import * as b64toBlob from 'b64-to-blob';
import {Settings} from 'common/core/config/settings.service';
import {HttpClient} from '@angular/common/http';
import {WatermarkToolService} from '../watermark-tool.service';
import {Toast} from 'common/core/ui/toast.service';
import {ucFirst} from '../../../../common/core/utils/uc-first';

type ValidFormats = 'png'|'jpeg'|'json';

@Injectable()
export class ExportToolService {
    constructor(
        private canvas: CanvasService,
        private cropzone: CropZoneService,
        private history: HistoryToolService,
        private config: Settings,
        private http: HttpClient,
        private watermark: WatermarkToolService,
        private toast: Toast,
    ) {}

    public getDefault(key: 'name'|'format'|'quality') {
        return this.config.get('pixie.tools.export.default' + ucFirst(key));
    }

    /**
     * Export current editor state in specified format.
     */
    public export(name?: string, format?: ValidFormats, quality?: number) {
        if ( ! name) name = this.getDefault('name');
        if ( ! format) format = this.getDefault('format');
        if ( ! quality) quality = this.getDefault('quality');

        const filename = name + '.' + format; let data;

        this.applyWaterMark();

        if (format === 'json') {
            data = this.getJsonState();
        } else {
            data = this.getDataUrl(format, quality);
        }

        this.watermark.remove();

        if ( ! data) return;

        this.getCanvasBlob(format, data).then(blob => {
            saveAs(blob, filename);
        });
    }

    public save(share: string, category: number, group: number, templateName: string, saveType: number) {
      let data;

      data = this.getJsonState();
      this.watermark.remove();

      if ( ! data) return;
            
      if (this.config.has('pixie.saveUrl')) {
            fetch(
                this.config.get('pixie.saveUrl'),
                {
                    method: 'POST',
                    cache: 'no-cache',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({'raw_json': data,
                                          'template_name': templateName,
                                          'template_type': '7',
                                          'draft': saveType}),
                    mode: 'no-cors'
                }
            )
            .then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(response => {
              console.log('Success:', response);
              window.location.href = window.location.protocol + '//' + window.location.hostname + window.location.pathname;
            });
      }
    }

    public update(id: number, share: string, category: number, group: number, templateName: string, saveType: number) {
        let data;
  
        data = this.getJsonState();
        this.watermark.remove();
        
        if ( ! data) return;
        
        if (this.config.has('pixie.updateUrl')) {
            fetch(
                this.config.get('pixie.updateUrl'),
                {
                    method: 'POST',
                    cache: 'no-cache',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                                          'id': id,
                                          'raw_json': data,
                                          'template_name': templateName,
                                          'template_type': '7',
                                          'draft': saveType}),
                    mode: 'no-cors'
                }
            )
            .then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(response => {
              console.log('Success:', response);
              window.location.href = window.location.protocol + '//' + window.location.hostname + window.location.pathname;
            });
      }
    }

    public get(id: number): Promise<Object> {
        return new Promise(resolve => {
            if (this.config.get('pixie.getUrl')) {
                console.log(this.config.get('pixie.getUrl') + '/' + id);
                fetch(
                    this.config.get('pixie.getUrl') + '/' + id,
                    {
                        method: 'GET',
                        headers: {
                        'Content-Type': 'application/json',
                        },
                        mode: 'no-cors'
                    })
                    .then(resp => resp.json())
                    .then(data => resolve(data))
                    .catch(error => console.log('Error:', error));
            }
        });
    }

    private getCanvasBlob(format: ValidFormats, data: string): Promise<Blob> {
        return new Promise(resolve => {
            let blob;

            if (format === 'json') {
                blob = new Blob([data], {type: 'application/json'});
            } else {
                const contentType = 'image/' + format;
                data = data.replace(/data:image\/([a-z]*)?;base64,/, '');
                blob = (b64toBlob as any)(data, contentType);
            }

            resolve(blob);
        });
    }

    /**
     * Export current editor state as data url.
     */
    public getDataUrl(format: ValidFormats = this.getDefault('format'), quality: number = this.getDefault('quality')): string {
        this.prepareCanvas();
        try {
            let svg = this.canvas.fabric().toSVG({
                suppressPreamble: true,
                viewBox: {
                    x: 0,
                    y: 0,
                    width:  this.canvas.state.original.width,
                    height:  this.canvas.state.original.height
                },
                encoding: ''}, );

            svg = svg.replace(/width=\"\d+\.\d+\" height=\"\d+\.\d+\"/, `width="${this.canvas.state.original.width}" height="${this.canvas.state.original.height}"`);
            debugger;

            saveAs(new Blob([svg], {type: 'image/svg+xml'}), 'testsvg.svg');
            
            /*return this.canvas.fabric().toDataURL({
                format: format,
                quality: quality,
                multiplier: this.canvas.state.original.width / this.canvas.fabric().getWidth(),
            });*/
        } catch (e) {
            if (e.message.toLowerCase().indexOf('tainted') === -1) return null;
            this.toast.open('Could not export canvas with external image.');
        }
    }

    private getJsonState(): string {
        return JSON.stringify(this.history.getCurrentCanvasState());
    }

    private prepareCanvas() {
        this.canvas.fabric().discardActiveObject();
        this.canvas.pan.reset();
        this.cropzone.remove();
    }

    private applyWaterMark() {
        const watermark = this.config.get('pixie.watermarkText');

        if (watermark) {
            this.watermark.add(watermark);
        }
    }
}
