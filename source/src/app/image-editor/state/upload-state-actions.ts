export class UploadProfile {
    static readonly type = '[Uploaded] Profile';
    constructor(public uploadProfile: boolean) {}
}

export class UploadMLS {
    static readonly type = '[Uploaded] MLS';
    constructor(public uploadMLS: boolean) {}
}