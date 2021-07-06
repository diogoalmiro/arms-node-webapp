const { serversideevents } = require("@webfocus/util");
const Database = require("better-sqlite3");
const workflowWrap = require("./workflow-wrap");
const path = require('path');
const fs = require('fs/promises');
const createWriteStream = require("fs").createWriteStream;
const sharp = require("sharp");
const pug = require("pug");
const archiver = require("archiver");

let component = module.exports = require("@webfocus/component")("Worker Component", "Run workflow and create archives.");
component.hidden = true;
component.app.get("/", serversideevents(component, ["workflow"]))

component.on("configuration", ({statusDatabasePath, resultFolder}) => {
    let db = new Database(statusDatabasePath);

    db.exec(`CREATE TABLE IF NOT EXISTS workflow (
        path TEXT UNIQUE NOT NULL,
        filename TEXT NOT NULL,
        queued TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ocr_started TIMESTAMP,
        ocr_stdout TEXT DEFAULT '',
        ocr_stderr TEXT DEFAULT '',
        ocr_concluded TIMESTAMP,
        archive_started TIMESTAMP,
        archive_progress REAL DEFAULT 0,
        archive_concluded TIMESTAMP
    )`)

    // One job at the time, if ocr_started is NOT NULL the process might have stopped before
    let nextPath = db.prepare("SELECT path, ocr_concluded FROM workflow WHERE ocr_concluded IS NULL OR archive_concluded IS NULL ORDER BY queued ASC LIMIT 1");
    
    // Update status
    let ocr_started = db.prepare("UPDATE workflow SET ocr_started = CURRENT_TIMESTAMP, ocr_stderr = '', ocr_stdout = '' WHERE path LIKE :path")
    let ocr_stderr = db.prepare("UPDATE workflow SET ocr_stderr = ocr_stderr || :text WHERE path LIKE :path")
    let ocr_stdout = db.prepare("UPDATE workflow SET ocr_stdout = ocr_stdout || :text WHERE path LIKE :path")
    let ocr_concluded = db.prepare("UPDATE workflow SET ocr_concluded = CURRENT_TIMESTAMP WHERE path LIKE :path")
    let archive_started = db.prepare("UPDATE workflow SET archive_started = CURRENT_TIMESTAMP, archive_progress = 0 WHERE path LIKE :path")
    let archive_progress = db.prepare("UPDATE workflow SET archive_progress = :progress WHERE path LIKE :path")
    let archive_concluded = db.prepare("UPDATE workflow SET archive_concluded = CURRENT_TIMESTAMP WHERE path LIKE :path")



    function threadLike(){
        let workflowStatus = nextPath.get();
        if( workflowStatus == null ) return setTimeout(threadLike, 500); // Update every X frames
        
        if( !workflowStatus.ocr_concluded ){
            component.emit("workflow", {type: "ocr_started", path: workflowStatus.path})
            ocr_started.run({path: workflowStatus.path})
            workflowWrap(workflowStatus.path, [], p => {
                p.stdout.on("data", d => {
                    ocr_stdout.run({path: workflowStatus.path, text: d.toString()});
                    component.emit("workflow", {type: "ocr_stdout", path: workflowStatus.path, data: d.toString()});
                });
                p.stderr.on("data", d => {
                    ocr_stderr.run({path: workflowStatus.path, text: d.toString()});
                    component.emit("workflow", {type: "ocr_stderr", path: workflowStatus.path, data: d.toString()});
                });
            }).then( _ => {
                component.emit("workflow", {type: "ocr_concluded", path: workflowStatus.path})
                ocr_concluded.run({path: workflowStatus.path})
            }).catch(e => {
                console.error(e);
            }).finally(_ => setImmediate(threadLike))
        }
        else{
            component.emit("workflow", {type: "archive_started", path: workflowStatus.path})
            archive_started.run({path: workflowStatus.path})
            archiveWrap(workflowStatus.path).then(_ => {
                component.emit("workflow", {type: "archive_concluded", path: workflowStatus.path})
                archive_concluded.run({path: workflowStatus.path})
            }).catch(e => {
                console.error(e);  
            }).finally(_ => setImmediate(threadLike))
        }

    }

    async function archiveWrap(pathToFile){
        const parsedPath = path.parse(pathToFile);

        const templateFolder = path.join(__dirname,'templates');
        const workflowTmpFolder = path.join(__dirname, 'workflow', 'exec', 'tmp', parsedPath.base);
        
        const outFolder = path.join(__dirname, 'tmp', parsedPath.name);

        const thumbnailFolder = path.join(outFolder, "pages_thumbnail");
        const imageFolder = path.join(outFolder, "pages_png");
        const htmlFolder = path.join(outFolder, "pages_html");
        const hocrFolder = path.join(outFolder, "pages_hocr");
        // Create folders
        await fs.mkdir(outFolder, { recursive: true });

        await fs.mkdir(thumbnailFolder, { recursive: true });
        await fs.mkdir(imageFolder, { recursive: true });
        await fs.mkdir(htmlFolder, { recursive: true });
        await fs.mkdir(hocrFolder, { recursive: true });

        // gather pdf
        await fs.copyFile(path.join(__dirname, 'workflow', 'results', parsedPath.base, parsedPath.base+'.pdf'), path.join(resultFolder, parsedPath.name+'.pdf'))
        const {pages} = await sharp(pathToFile).metadata()
        
        let promises = [];
        for( let i = 0; i < pages; i++ ){
            // Create pngs & thumbnails
            // It can be done async
            promises.push(sharp(pathToFile, {page: i}).resize(2000,2000, { fit: 'inside'}).png({quality: 100}).toFile(path.join(imageFolder, `page_${i}.png`)))
            promises.push(sharp(pathToFile, {page: i}).resize(200,200, { fit: 'inside'}).png({quality: 100}).toFile(path.join(thumbnailFolder, `page_${i}.png`)))

            // Copy hocr (if exists)
            await fs.copyFile(path.join(workflowTmpFolder, 'pages', `page_${i+1}.hocr`),path.join(hocrFolder, `page_${i}.hocr`)).catch(_ => 0)
            let hocr = (await fs.readFile(path.join(hocrFolder, `page_${i}.hocr`)).catch(_ => "")).toString();
            const html = pug.renderFile(path.join(templateFolder,'page.pug'), {pages: pages, page: i, name: parsedPath.name, hocr: hocr, pretty: true})
            await fs.writeFile(path.join(htmlFolder, `page_${i}.html`), html)
            component.emit("workflow", {type: "archive_progress", path: pathToFile, progress: (i+1)/pages})
            archive_progress.run({path: pathToFile, progress: (i+1) / pages});
        }
        
        const html = pug.renderFile(path.join(templateFolder, 'index.pug'), {pages: pages, name: parsedPath.name, pretty: true}) 
        await fs.writeFile(path.join(outFolder, 'index.html'), html);
        let assets = path.join(templateFolder, "assets")
        for( let file of await(fs.readdir(assets)) ){
            await fs.copyFile(path.join(assets, file), path.join(htmlFolder, file));
        }
        await Promise.all(promises);
        const archive = archiver('zip');
        archive.directory(outFolder, parsedPath.name);

        const outZip = createWriteStream(path.join(resultFolder, parsedPath.name+'.zip'));
        archive.pipe(outZip);

        await fs.rm(workflowTmpFolder, {recursive: true}).catch(e => console.error(e))
    }
    
    setImmediate(threadLike)
})
