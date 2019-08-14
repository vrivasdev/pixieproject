import { Injectable } from '@angular/core';
import {UploadValidator} from '../../../../common/uploads/validation/upload-validator';
import {FileSizeValidation} from '../../../../common/uploads/validation/validations/file-size-validation';
import {AllowedExtensionsValidation} from '../../../../common/uploads/validation/validations/allowed-extensions-validation';
import {convertToBytes} from '../../../../common/core/utils/convertToBytes';
import { Settings } from '../../../../../src/common/core/config/settings.service';
import { Toast } from '../../../../../src/common/core/ui/toast.service';
import { Translations } from '../../../../../src/common/core/translations/translations.service';

@Injectable({
    providedIn: 'root'
})
export class ImportToolValidator extends UploadValidator {
    protected readonly DEFAULT_MAX_FILE_SIZE_MB = 10;
    public showToast = true;

    constructor(
        protected settings: Settings,
        protected toast: Toast,
        protected i18n: Translations
    ) {
        super(settings, toast, i18n);
    }

    protected initValidations() {
        this.validations.push(
            new FileSizeValidation(
                {maxSize: this.getMaxFileSize()},
                this.i18n
            )
        );

        const allowedExtensions = this.getAllowedExtensions();

        if (allowedExtensions && allowedExtensions.length) {
            this.validations.push(new AllowedExtensionsValidation(
                {extensions: allowedExtensions}, this.i18n
            ));
        }
    }

    protected getMaxFileSize(): number {
        return this.settings.get(
            'pixie.tools.import.maxFileSize',
            convertToBytes(this.DEFAULT_MAX_FILE_SIZE_MB, 'MB')
        );
    }

    protected getAllowedExtensions() {
        return this.settings.get('pixie.tools.import.validExtensions');
    }
}
