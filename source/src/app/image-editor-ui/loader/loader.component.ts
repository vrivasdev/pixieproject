import { Component } from "@angular/core";
import { Settings } from 'common/core/config/settings.service';

@Component({
    selector: 'loader',
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.scss']
})
export class LoaderComponent {
    private loader = document.getElementById('gif-loader');

    constructor(
        private config: Settings
    ) {}
    
    public getImage(img: string) {
        return this.config.getAssetUrl(img);
    }
}