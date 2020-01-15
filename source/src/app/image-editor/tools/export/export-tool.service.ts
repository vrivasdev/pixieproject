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
import * as $ from 'jquery';

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

    public getRawJson(data): Array<string> {
        let raw_json =  null;
        let raw_json_back = null;
        //const base = window.location.protocol + '//' + window.location.hostname + window.location.pathname;
        const base = 'http://devven2.avantiway.com/vrivas/myavex.avantiway.com/design/';
        const tab = localStorage.getItem('tab');
        const service = 'getJson';
        const type = localStorage.getItem('tab');
        const globalUrl = window.location.pathname.split('')[window.location.pathname.length - 1];

        fetch((globalUrl !== '/') ? `${base}/${service}/${type}` : `${base}${service}/${type}`)
                    .then(resp => resp.json())
                    .then(json => {
                        if (!localStorage.getItem('tab')) {
                            raw_json = data;
                        } else if (tab === 'front') {
                            raw_json = data;
                            raw_json_back = JSON.parse(json.data);
                        } else if (tab === 'back') {
                            raw_json = JSON.parse(json.data);
                            raw_json_back = data;
                        }
                    })
                    .catch(error => console.log(`Error: ${error}`));
        return [raw_json, raw_json_back];
    }

    public save(share: string, category: number, group: number, templateName: string, saveType: number) {
        let data;
        let raw_json =  null;
        let raw_json_back = null;
        //const base = 'http://devven2.avantiway.com/vrivas/myavex.avantiway.com/design/';
        const base = window.location.protocol + '//' + window.location.hostname + window.location.pathname;
        const tab = localStorage.getItem('tab');
        const service = 'getJson';
        const globalUrl = window.location.pathname.split('')[window.location.pathname.length - 1];
        const otherTab = tab === 'front'? 'back': 'front';
        
        data = this.getJsonState();
        this.watermark.remove();
        
        if ( ! data) return;

        fetch((globalUrl !== '/') ? `${base}/${service}/${otherTab}` : `${base}${service}/${otherTab}`)
            .then(resp => resp.json())
            .then(json => {
                console.log('get front or back');
                if (!localStorage.getItem('tab')) {
                    raw_json = data;
                } else if (tab === 'front') {
                    raw_json = data;
                    raw_json_back = json.data;
                } else if (tab === 'back') {
                    raw_json = json.data;
                    raw_json_back = data;
                }
                if (this.config.has('pixie.saveUrl')) {
                    fetch(
                        this.config.get('pixie.saveUrl'),
                        {
                            method: 'POST',
                            cache: 'no-cache',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({'raw_json': raw_json,
                                                    'raw_json_back': raw_json_back,
                                                    'template_name': templateName,
                                                    'template_type': '7',
                                                    'draft': saveType}),
                            mode: 'no-cors'
                        }
                    )
                    .then()
                    .then(response => {
                        console.log('Success:', response);
                        localStorage.setItem('active', 'false');
                        window.location.href = window.location.protocol + '//' + window.location.hostname + window.location.pathname;
                    })
                    .catch(error => console.error('Error:', error));
                }
            })
            .catch(error => console.log(`Error: ${error}`));
    }

    public update(id: number, share: string, category: number, group: number, templateName: string, saveType: number) {
        let data;
        let raw_json =  null;
        let raw_json_back = null;
        const base = window.location.protocol + '//' + window.location.hostname + window.location.pathname;
        const tab = localStorage.getItem('tab');
        const service = 'getJson';
        const globalUrl = window.location.pathname.split('')[window.location.pathname.length - 1];
        const otherTab = tab === 'front'? 'back': 'front';
          
        data = this.getJsonState();
        this.watermark.remove();
        
        if ( ! data) return;
        fetch((globalUrl !== '/') ? `${base}/${service}/${otherTab}` : `${base}${service}/${otherTab}`)
            .then(resp => resp.json())
            .then(json => {
                if (!localStorage.getItem('tab')) {
                    raw_json = data;
                } else if (tab === 'front') {
                    raw_json = data;
                    raw_json_back = json.data;
                } else if (tab === 'back') {
                    raw_json = json.data;
                    raw_json_back = data;
                }
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
                                                  'raw_json': raw_json,
                                                  'raw_json_back': raw_json_back,
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
                      localStorage.setItem('active', 'false');
                      window.location.href = window.location.protocol + '//' + window.location.hostname + window.location.pathname;
                    });
                }
            });
    }

    public get(id: number): Promise<Object> {
        return new Promise(resolve => {
            if (this.config.get('pixie.getUrl')) {
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
            // Transforming into SVG format
            const svg = this.canvas.fabric().toSVG({
                suppressPreamble: true,
                viewBox: {
                    x: 0,
                    y: 0,
                    width:  this.canvas.state.original.width,
                    height:  this.canvas.state.original.height
                },
                encoding: ''});
            const result = svg.replace(/width=\"\d+\.\d+\" height=\"\d+\.\d+\"/,
                                     `width="${this.canvas.state.original.width}" height="${this.canvas.state.original.height}"`)
                              .replace(/\"/g, '\'')
                              .replace(/(\r\n|\n|\r|\b|\f|\t)/gm, '');
            $.ajax({
                url : this.config.get('pixie.renderize'),
                type : 'post',
                cache : false,
                dataType : 'json',
                data : JSON.stringify({
                    'svg': result,
                    'to': format
                }),
            error : (e) => {
                console.log( 'Error:', e);
            },
            success : (response) => {
                saveAs(`data:image/jpeg;base64, ${response.data}`, `${this.getDefault('name')}.${format}`);
            }
        });
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
