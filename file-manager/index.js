const { pagination } = require("@webfocus/util");
const Database = require("better-sqlite3");
const fs = require("fs")
const path = require("path")


const component = module.exports = require("@webfocus/component")("File Manager", "Manage files to OCR.");

component.on("configuration", ({uploadFolder, statusDatabasePath}) => {
    const db = new Database(statusDatabasePath);

    const insertFile = db.prepare("INSERT INTO workflow(path, filename) VALUES (:path, :filename)");
    const stmStatus = db.prepare("SELECT * FROM workflow WHERE path = :path");
    const stmDelete = db.prepare("DELETE FROM workflow WHERE path = :path");
    const stmRerun = db.prepare("UPDATE workflow SET ocr_concluded = NULL, archive_concluded = NULL, ocr_error = NULL, archive_error = NULL WHERE path = :path");

    const stmSelect = db.prepare("SELECT * FROM workflow")
    let dbFiles = stmSelect.all();
    // Ensure database is consistent with fs
    let fsFiles = fs.readdirSync(uploadFolder);
    // Remove db elements not in fs
    dbFiles.filter( o => !fsFiles.includes(o.filename) ).map(o => stmDelete.run(o));
    // insert fs element not in db
    fsFiles.filter( f => !dbFiles.map(o => o.filename).includes(f) ).map( f => insertFile.run({path: path.join(uploadFolder, f), filename: f}))

    component.app.post("/", (req, res, next) => {
        if( !req.query.filename ) return next(new Error("Query parameter 'filename' required."))
        if( req.headers["content-type"] != "image/tiff" ) return next(new Error("Can only post files with mime type 'image/tiff'."));
        
        const pathToFile = path.join(uploadFolder, req.query.filename)
        req.pipe(fs.createWriteStream(pathToFile, { flags: 'wx' })
            .on("error", (e) => {
                if( e.code == 'EEXIST' ) next(new Error("The file '"+req.query.filename+"' already exists."))
                else next(e);
            }).on('finish', _ => {
                res.json("File Uploaded!")
                insertFile.run({path: pathToFile, filename: req.query.filename});
            }));
    })

    component.app.get("/", pagination(async () => fs.readdirSync(uploadFolder), null, (filename) => {
        const pathToFile = path.join(uploadFolder, filename);
        console.log(filename, uploadFolder, pathToFile);
        return stmStatus.get({path: pathToFile});
    }))

    component.app.delete("/", (req, res, next) => {
        if( !req.body.filename ) return next(new Error("Body parameter 'filename' required."))
        const pathToFile = path.join(uploadFolder, req.body.filename);
        fs.rm(pathToFile, (err) => {
            if(err) return next(err);

            res.json(stmDelete.run({path: pathToFile}));
        })
    })

    component.app.put("/", (req, res, next) => {
        if( !req.body.filename ) return next(new Error("Body parameter 'filename' required."))
        const pathToFile = path.join(uploadFolder, req.body.filename);
        res.json(stmRerun.run({path: pathToFile}));
    })

})

