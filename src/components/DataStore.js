const electron = require('electron')
const path = require('path')
const fs = require('fs')

module.exports = class DataStore {

    constructor({
        filename,
        defaults = {}
    }) {

        this.filename = filename
        this.defaults = defaults

        if (this.filename) {
            this.data = this.readFile()
        }

    }

    setFilename(filename) {
        this.filename = filename
    }

    getFilepath() {
        return path.join((electron.app || electron.remote.app).getPath('userData'), this.filename + '.json')
    }

    readFile() {
        try {
            return JSON.parse(fs.readFileSync(this.getFilepath()))
        } catch (e) {
            return this.defaults
        }
    }

    writeFile() {
        fs.writeFileSync(this.getFilepath(), JSON.stringify(this.data))
    }

    get(key) {
        return this.data[key]
    }

    set(key, value) {
        this.data[key] = value
        this.writeFile()
    }

}