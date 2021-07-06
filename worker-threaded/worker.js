const {workerData, parentPort} = require("worker_threads");
const path = require("path");
const fs = require("fs/promises");
const Database = require("better-sqlite3");

const db = new Database(workerData.statusDatabasePath);
const ocrWrap = require('./ocr-wrap');
const archiveWrap = require('./archive-wrap');

const IDLE_TIME = 1000;

// One job at the time, if ocr_started is NOT NULL the process might have stopped before
const nextPath = db.prepare(`
    SELECT path, ocr_concluded
    FROM workflow
    WHERE 
        (ocr_concluded IS NULL OR
        archive_concluded IS NULL) AND
        ocr_error IS NULL AND
        archive_error IS NULL
        ORDER BY queued ASC LIMIT 1
`);

// Update status
const updates = {
    ocr_started: db.prepare("UPDATE workflow SET ocr_started = CURRENT_TIMESTAMP, ocr_stderr = '', ocr_stdout = '' WHERE path LIKE :path"),
    ocr_stderr: db.prepare("UPDATE workflow SET ocr_stderr = ocr_stderr || :data WHERE path LIKE :path"),
    ocr_stdout: db.prepare("UPDATE workflow SET ocr_stdout = ocr_stdout || :data WHERE path LIKE :path"),
    ocr_concluded: db.prepare("UPDATE workflow SET ocr_concluded = CURRENT_TIMESTAMP WHERE path LIKE :path"),
    ocr_error: db.prepare("UPDATE workflow SET ocr_error = CURRENT_TIMESTAMP WHERE path LIKE :path"),
    archive_started: db.prepare("UPDATE workflow SET archive_started = CURRENT_TIMESTAMP, archive_progress = 0 WHERE path LIKE :path"),
    archive_progress: db.prepare("UPDATE workflow SET archive_progress = :data WHERE path LIKE :path"),
    archive_concluded: db.prepare("UPDATE workflow SET archive_concluded = CURRENT_TIMESTAMP WHERE path LIKE :path"),
    archive_error: db.prepare("UPDATE workflow SET archive_error = CURRENT_TIMESTAMP WHERE path LIKE :path")
}

function post(event, where, data){
    if( !data ){
        updates[event].run({path: where})
    }
    else{
        updates[event].run({path: where, data})
    }
    parentPort.postMessage({type: event, path: where, data: data});
}

async function loop(){
    const workflowStatus = nextPath.get();
    if( !workflowStatus ) return setTimeout(loop, IDLE_TIME);
    const {path: pathToFile, ocr_concluded} = workflowStatus;
    const parsedPath = path.parse(pathToFile)
    const hocrTmpFolder = path.join(workerData.hocrTmpFolder, parsedPath.name);
    if( !ocr_concluded ){
        // Run ocr
        post("ocr_started", pathToFile)
        ocrWrap(pathToFile, [], p => {
            p.stdout.on("data", d => post("ocr_stdout", pathToFile, d.toString()));
            p.stderr.on("data", d => post("ocr_stderr", pathToFile, d.toString()));
        })
            .then( async _ => {
                const workflowTmpFolder = path.join(__dirname, 'workflow', 'exec', 'tmp', parsedPath.base);
                const workflowTmpFolderPages = path.join(workflowTmpFolder, 'pages');

                await fs.mkdir(hocrTmpFolder, { recursive: true });

                const hocrFiles = await fs.readdir(workflowTmpFolderPages);
                await Promise.all(hocrFiles.filter(name => name.match(/\.hocr$/)).map(name => fs.copyFile(path.join(workflowTmpFolderPages, name), path.join(hocrTmpFolder, name)).catch(_ => null)))

                await fs.copyFile(path.join(__dirname, 'workflow', 'results', parsedPath.base, parsedPath.base+'.pdf'), path.join(workerData.resultFolder, parsedPath.name+'.pdf'))
                
                // Clear workflow files
                await fs.rm(workflowTmpFolder, {recursive: true}).catch(e => console.error(e))
                post("ocr_concluded", pathToFile)
            })
            .catch(e => {
                post("ocr_error", pathToFile)
                console.log(e)
            })
            .finally(_ => setImmediate(loop))
    }
    else{
        // Run sharp
        post("archive_started", pathToFile);
        archiveWrap(pathToFile, workerData.resultFolder, hocrTmpFolder, (page, pages) => {
            post("archive_progress", pathToFile, page/pages)
        })
            .then(_ => post("archive_concluded", pathToFile))
            .catch(e => {
                post("archive_error", pathToFile)
                console.error(e)
            })
            .finally(_ => setImmediate(loop))
    }
}

setImmediate(loop);