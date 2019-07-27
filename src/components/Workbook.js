const xlsx = require('xlsx')
const fs = require('fs')

module.exports = class Workbook {

    constructor({
        filepath
    }) {

        this.data = {}

        if (filepath) {
            this.setFilepath(filepath)
        }

    }

    setFilepath(filepath) {
        this.filepath = filepath
        this.refreshData()
    }

    getFilepath(filepath) {
        return this.filepath
    }

    readFile() {

        let result = {}

        try {
            result = xlsx.readFile(this.getFilepath())
        } catch(e) {}

        return result
        
    }

    refreshData() {
        this.data = this.readFile()
    }

    getData() {
        return this.data
    }

    toJSON() {

        if (Object.entries(this.data).length == 0) {
            return null
        }

        let output = []

        for (let [sheetname, table] of Object.entries(this.data.Sheets)) {

            let headers = []
            let map = {}

            for (let [coord, cell] of Object.entries(table)) {

                let x = coord.replace(/[^A-Z]/g, '')
                let y = coord.replace(/[^0-9]/g, '')

                let value = cell.v

                if (y == '1') {
                    headers.push(value)
                    continue
                }

                if (x == 'A') {
                    map[y] = {}
                }

                try {
                    map[y][x] = value || ''
                } catch (e) {}

            }

            output.push({
                name: sheetname,
                headers,
                map
            })

        }
        
        return output

    }

}