let path = require("path")
let fs = require("fs");
let WebfocusApp = require('@webfocus/app');
const Database = require("better-sqlite3");

let configuration = {
    port : parseInt(process.env.PORT), // Specify your port here
    name : "ARMS",
    // Add more configurations here
    uploadFolder: path.join(__dirname, "persist", "tif-uploads"),
    resultFolder: path.join(__dirname, "persist", "ocr-results"),
    hocrTmpFolder : path.join(__dirname, "persist", "ocr-tmp-files"),
    statusDatabasePath : path.join(__dirname, "persist", "workflow-status.db")
}

fs.mkdirSync(configuration.uploadFolder, { recursive: true })
fs.mkdirSync(configuration.resultFolder, { recursive: true })
fs.mkdirSync(configuration.hocrTmpFolder, { recursive: true })

new Database(configuration.statusDatabasePath).exec(`CREATE TABLE IF NOT EXISTS workflow (
    path TEXT UNIQUE NOT NULL,
    filename TEXT NOT NULL,
    queued TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ocr_started TIMESTAMP,
    ocr_stdout TEXT DEFAULT '',
    ocr_stderr TEXT DEFAULT '',
    ocr_concluded TIMESTAMP,
    ocr_error TIMESTAMP,
    archive_started TIMESTAMP,
    archive_progress REAL DEFAULT 0,
    archive_concluded TIMESTAMP,
    archive_error TIMESTAMP
)`)

let webfocusApp = new WebfocusApp( configuration );

// Register webfocus/app comonents here
// e.g. webfocusApp.registerComponent(require('../component-example'));
webfocusApp.registerComponent(require('@webfocus/util/component'));
//webfocusApp.registerComponent(require('./worker'));
webfocusApp.registerComponent(require('./worker-threaded'));
webfocusApp.registerComponent(require('./file-manager'));
webfocusApp.registerComponent(require('./status'));
webfocusApp.registerComponent(require('./result'));

webfocusApp.start();
