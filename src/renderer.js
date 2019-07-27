/* Modules */

const DataStore = require('./components/DataStore')
const Workbook = require('./components/Workbook')
const View = require('./components/View')

/* Constants */

let userPrefs = new DataStore({
    filename: 'user-preferences',
    defaults: require('./configs/defaults.json')['user-preferences']
})

let workbook = new Workbook({
    filepath: userPrefs.get('workbook').filepath
})

let views = {
    searchSheets: new View({
        filename: 'searchSheets'
    }),
    searchHeaders: new View({
        filename: 'searchHeaders'
    }),
    filterSelect: new View({
        filename: 'filters'
    }),
    tables: new View({
        filename: 'tables'
    }),
    expandList: new View({
        filename: 'expandList'
    })
}

/* Pre-defined variables */

let ctrlDown = false
let workbookData = workbook.toJSON()

/* Updates */

function setActiveView(id) {

    document.querySelector('.view-active').classList.remove('view-active')
    document.getElementById(id).classList.add('view-active')
    
}

function setActiveModal(id) {

    let cur = document.querySelector('.modal-active')

    if (cur) {
        cur.classList.remove('modal-active')
    }

    if (id == null) {
        document.querySelector('.modal-container').classList.add('hidden')
        return
    }

    document.querySelector('.modal-container').classList.remove('hidden')
    document.getElementById(id).classList.add('modal-active')

}

function resetSearch() {

    let searchActiveEl = document.querySelector('.search-active')
    let searchTableEl = document.querySelector('.search-table')

    if (searchActiveEl) {
        searchActiveEl.classList.remove('search-active')
    }

    if (searchTableEl) {
        searchTableEl.classList.remove('search-table')
    }

    let elems = document.querySelectorAll('.search-result')

    for (let el of elems) {
        el.classList.remove('search-result')
    }

}

function updateSearch(f) {

    let q = f.elements['query'].value

    if (q.trim().length == 0) {
        alert('Search value cannot be empty!')
        return
    }

    if (workbookData == null) {
        alert('No workbook active!')
        return
    }

    resetSearch()

    let tablesEl = document.getElementById('tables')
    let sheetEl = f.elements['sheet']
    let headerEl = f.elements['header']

    tablesEl.classList.add('search-active')

    let sname = sheetEl.options[sheetEl.selectedIndex].text
    let hname = headerEl.options[headerEl.selectedIndex].text

    let tablesList = tablesEl.querySelectorAll('table')
    let foundTable

    [...tablesList].some(t => {
        if (t.dataset.sheetname == sname) {
            foundTable = t
            return
        }
    })

    foundTable.classList.add('search-table')

    let hElems = foundTable.querySelector('thead').querySelectorAll('th')
    let hIdx

    [...hElems].some((th, i) => {
        if (th.innerText == hname) {
            hIdx = i
            return
        }
    })

    let rElems = foundTable.querySelector('tbody').querySelectorAll('tr')

    rElems.forEach(tr => {
        [...tr.children].forEach((td, i) => {
            if (i != hIdx) return
            if (!td.innerText.includes(q)) return
            tr.classList.add('search-result')
        })
    })

    alert('Search completed successfully!')

}

function updateSearchSheet(e) {

    let { filters } = userPrefs.get('workbook')

    let value = e.options[e.selectedIndex].text
    let headers = []

    workbookData.forEach((s, i) => {

        if (s.name != value) {
            return
        }

        s.headers.forEach(h => {
            if (!filters[s.name].headers[h].active) {
                return
            }
            headers.push(h)
        })

    })

    document.getElementById('searchHeaders').innerHTML = views.searchHeaders.render({
        sheet: { headers }
    })

}

function updateWorkbook(f) {

    // choose file

    let { files } = f.elements[1]

    if (files.length != 1) {
        alert('Too many files selected!')
        return
    }

    let filepath = files[0].path

    if (filepath == userPrefs.get('workbook').filepath) {
        alert('Selected file is already active!')
        return
    }

    // update workbook and workbookData

    workbook.setFilepath(filepath)
    workbookData = workbook.toJSON()

    // update prefs

    let workbookPrefs = {
        filepath,
        filters: {}
    }

    workbookData.forEach(sheet => {

        let headers = {}

        sheet.headers.forEach(header => {
            headers[header] = {
                active: true
            }
        })

        workbookPrefs.filters[sheet.name] = {
            active: true,
            headers
        }

    })

    userPrefs.set('workbook', workbookPrefs)

    // update views

    renderFilters()
    renderSearchbox(true)
    renderTables(true)

    alert('Workbook file changed successfully!')

}

function updateFilters(f) {

    if (workbookData == null) {
        alert('No workbook active!')
        return
    }

    let workbookPrefs = userPrefs.get('workbook')
    let { filters } = workbookPrefs

    let sets = f.getElementsByTagName('fieldset')

    for (let set of sets) {

        let sheetname = set.dataset.sheet

        for (let [j, el] of Object.entries(set.elements)) {

            if (j == 0) {
                filters[sheetname].active = el.checked
                continue
            }

            filters[sheetname].headers[el.dataset.header].active = el.checked

        }

    }

    workbookPrefs.filters = filters
    userPrefs.set('workbook', workbookPrefs)

    // update views

    renderSearchbox()
    renderTables()

    alert('Filters updated successfully!')

}

function expandRow(el, sheetname) {

    if (!ctrlDown) {
        return
    }

    let row = el.parentElement
    let elIdx

    let headers = []
    let elems = []

    let { filters } = userPrefs.get('workbook')

    for (let [hname, h] of Object.entries(filters[sheetname].headers)) {
        if (h.active) {
            headers.push(hname)
        }
    }

    let i = 0

    for (let c of Object.values(row.children)) {

        if (c == el) {
            elIdx = i
        }

        elems.push(c)
        i++

    }

    let leftList = []
    let rightList = []

    headers.forEach((h, j) => {

        let data = { header: h, value: elems[j].innerText }

        if (elIdx == j) {
            leftList.push(data)
        } else {
            rightList.push(data)
        }

    })

    document.getElementById('expand').innerHTML = views.expandList.render({ 
        leftList, rightList
    })

    setActiveModal('expand')

}

function refreshWorkbook() {

    workbook.refreshData()
    workbookData = workbook.toJSON()

    renderSearchbox()
    renderFilters()
    renderTables()

    alert('Workbook reloaded successfully!')

}

/* Rendering */

function renderSearchbox(c = false) {

    let sheets = []
    let headers = []

    if (!c && workbookData != null) {

        let { filters } = userPrefs.get('workbook')

        workbookData.forEach((s, i) => {

            if (!filters[s.name].active) {
                return
            }

            sheets.push({ name: s.name })

            if (i == 0) {

                s.headers.forEach(h => {
                    if (!filters[s.name].headers[h].active) {
                        return
                    }
                    headers.push(h)
                })

            }

        })

    }

    document.getElementById('searchSheets').innerHTML = views.searchSheets.render({
        sheets
    })

    document.getElementById('searchHeaders').innerHTML = views.searchHeaders.render({
        sheet: { headers }
    })

}

function renderFilters() {

    let workbook = []

    for (let sheet in workbookData) {
        workbook.push({ name: sheet.name, headers: sheet.headers })
    }

    document.getElementById('filterSelect').innerHTML = views.filterSelect.render({
        workbook: workbookData,
        filters: userPrefs.get('workbook').filters
    })

}

function renderTables(c = false) {

    let data

    if (c || workbookData == null) {
        data = null
    } else {

        let { filters } = userPrefs.get('workbook')
        data = []

        workbookData.forEach(sheet => {

            let f = filters[sheet.name]

            if (!f.active) {
                return
            }

            let table = { name: sheet.name, headers: [], map: [] }
            let h = []

            for (let [hname, hdata] of Object.entries(f.headers)) {

                if (hdata.active) {
                    table.headers.push(hname)
                }

                h.push(hdata.active)
            }

            for (let row of Object.values(sheet.map)) {

                let r = []
                let lIdx = -1

                for (let [x, v] of Object.entries(row)) {

                    let hIdx = x.charCodeAt(0) - 65
                    let d = hIdx - lIdx

                    // Ext column fix?
                    if (d > 1) {
                        for (let i = 1; i < d; i++) {
                            if (h[lIdx + i]) {
                                r.push('N/A')
                            }
                        }
                    }

                    if (h[hIdx]) {
                        r.push(v)
                    }

                    lIdx = hIdx

                }

                table.map.push(r)

            }

            data.push(table)

        })

    }

    document.getElementById('tables').innerHTML = views.tables.render({
        workbook: data
    })

}

/* On load */

window.onload = function () {

    document.addEventListener('keydown', e => {
        if (e.keyCode == 17) {
            ctrlDown = true
        }
    })

    document.addEventListener('keyup', e => {
        if (e.keyCode == 17) {
            ctrlDown = false
        }
    })

    // render views

    renderSearchbox()
    renderFilters()
    renderTables()

}