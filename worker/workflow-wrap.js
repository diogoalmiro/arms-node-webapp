const path = require("path");
const child_process = require("child_process");

const run = setupVenv();

module.exports = (pathToFile, flags=[], processCb=null) => new Promise((resolve, reject) => {
    let p = run(pathToFile, flags);
    if( typeof processCb == 'function' ){
        processCb(p);
    }
    p.on("close", (code, signal) => {
        if( code == 0 && signal == null ) resolve();
        else{
            reject({code, signal});
            p.stdout.pipe(process.stdout)
            p.stderr.pipe(process.stderr)
        } 
    })
})

function setupVenv(){
    const cwd = path.join(__dirname, "workflow","exec");
    const pyPath = path.join(cwd, "env", process.platform === "win32" ? "Scripts" : "bin" , "/")
    const pip = path.join(pyPath, 'pip3');
    const python = path.join(pyPath, 'python3');

    // This wil throw and stop execution if failed
    // 1. Create virtual envoronement (Fails when python3 or pip3 not installed)
    child_process.execSync(`python3 -m venv env`, { cwd });
    // 2. Install specific requirements (Fails when dependencies of requirements not installed e.g. tesseract-ocr)
    child_process.execSync(`${pip} install -r ../requirements.txt`, { cwd });
    
    // Add env var PYTHONUNBUFFERED=1 to recieve stdout/stderr updates
    process.env.PYTHONUNBUFFERED = 1

    // Create a run function for ocrs
    // possible flags: '--prep' and '--lang [ara|eng|osd|por|rus]'
    return (pathToFile, flags=[]) => child_process.exec(`${python} workflow.py ${flags.join(' ')} --tmp "${pathToFile}"`, { cwd });    
}