const electron = require('electron')
const pug = require('pug')
const path = require('path')

module.exports = class View {

    constructor({
        filename
    }) {

        this.filename = filename

        if (this.filename) {
            this.compiledFunction = this.compileFile()
        }

    }

    setFilename(filename) {
        this.filename = filename
    }

    getFilepath() {
        return path.join((electron.app || electron.remote.app).getAppPath(), 'src', 'views', this.filename + '.pug')
    }

    compileFile() {
        return pug.compileFile(this.getFilepath())
    }

    render(data) {
        return this.compiledFunction(data)
    }

}