PIXIE INSTALLATION GUIDE
========================
This are the installation's steps to run successfully the project on any enviroment

## STEPS
- If you alredy have installed nodeJS please Uninstall it before continue
- Install Node JS last version
- Run as admin the following commands:

```
1) $ rm -R node_modules -> If node_modules exists

->  Clean install (optional):
    $ npm clean-install 

2) $ npm update 

-> If node-gyp throws an error on update (optional):
    $ npm install -g node-gyp
    $ npm config set msvs_version 2015
    $ npm config set msvs_version 2015 --global
    $ npm config set node_gyp "node C:\Users\Víctor\AppData\Roaming\npm\node_modules\node-gyp\bin\node-gyp.js"
-> If canvas doesn't exist (optional):
    $ npm install canvas

3) $ npm install

4) $ npm i typescript@3.1.6 --save-dev --save-exact

```
- Finally execute the project
```
$ ng serve
```

## DEV TOOLS WITH REDUX FOR CHROME
$ npm install --save-dev @angular-devkit/build-angular