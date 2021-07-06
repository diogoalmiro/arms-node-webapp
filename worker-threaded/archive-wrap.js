const path = require('path');
const fs = require('fs/promises');
const createWriteStream = require("fs").createWriteStream;
const sharp = require("sharp");
const pug = require("pug");
const archiver = require("archiver");

module.exports = async function archiveWrap(pathToFile, resultFolder, hocrTmpFolder, progress){
    const parsedPath = path.parse(pathToFile);

    const templateFolder = path.join(__dirname,'templates');
    
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
    
    const {pages} = await sharp(pathToFile).metadata()
    const promises = []
    for( let i = 0; i < pages; i++ ){
        // Create pngs & thumbnails
        // It can be done async
        promises.push(sharp(pathToFile, {page: i}).resize(2000,2000, { fit: 'inside'}).png({quality: 100}).toFile(path.join(imageFolder, `page_${i}.png`)))
        promises.push(sharp(pathToFile, {page: i}).resize(200,200, { fit: 'inside'}).png({quality: 100}).toFile(path.join(thumbnailFolder, `page_${i}.png`)))

        let hocr = (await fs.readFile(path.join(hocrTmpFolder, `page_${i+1}.hocr`)).catch(_ => "")).toString();
        const html = pug.renderFile(path.join(templateFolder,'page.pug'), {pages: pages, page: i, name: parsedPath.name, hocr: hocr, pretty: true})
        await fs.writeFile(path.join(htmlFolder, `page_${i}.html`), html)

        if( typeof progress === 'function' ) progress(i+1, pages)
    }
    
    const html = pug.renderFile(path.join(templateFolder, 'index.pug'), {pages: pages, name: parsedPath.name, pretty: true}) 
    await fs.writeFile(path.join(outFolder, 'index.html'), html);
    let assets = path.join(templateFolder, "assets")
    for( let file of await(fs.readdir(assets)) ){
        await fs.copyFile(path.join(assets, file), path.join(htmlFolder, file));
    }
    await Promise.all(promises);
    
    await createZip(parsedPath.name, outFolder, resultFolder);
}

function createZip(name, folder, outFolder){
    return new Promise((resolve, reject) => {
        const archive = archiver('zip');

        archive.on("warning", (d) => console.log("WARNING", d))
        archive.on("error", (d) => console.log("ERROR", d))


        
        const outZip = createWriteStream(path.join(outFolder,name+'.zip'));
        outZip.on('error', (e) => {
            reject(e);
        })
        outZip.on('close', resolve)
        
        archive.directory(folder, name);
        archive.pipe(outZip);
        archive.finalize();
    })
}

