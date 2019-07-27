const { app, BrowserWindow } = require('electron')

if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

const DataStore = require('./components/DataStore')
const path = require('path')

const userPrefs = new DataStore({
    filename: 'user-preferences',
    defaults: require('./configs/defaults.json')['user-preferences']
})

let window

function createWindow() {

    let { width, height } = userPrefs.get('windowBounds')

    window = new BrowserWindow({
        icon: path.join(__dirname, 'favicon.ico'),
        width,
        height,
        webPreferences: {
            nodeIntegration: true
        }
    })

    window.loadURL(`file://${__dirname}/index.html`)

    window.setMenu(null)
    // window.webContents.openDevTools()

    window.on('resize', () => {
        let { width, height } = window.getBounds()
        userPrefs.set('windowBounds', { width, height })
    })

    window.on('closed', () => {
        window = null
    })

}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    if (window === null) {
        createWindow()
    }
})