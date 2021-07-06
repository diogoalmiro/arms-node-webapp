const {Worker} = require("worker_threads");
const path = require("path")
const { serversideevents } = require("@webfocus/util");

const component = module.exports = require("@webfocus/component")("Worker Component", "Run workflow and create archives.");
component.hidden = true;
component.app.get("/", serversideevents(component, ["workflow"]))

component.on("configuration", ({statusDatabasePath, resultFolder, hocrTmpFolder}) => {
    let worker = new Worker(path.join(__dirname,'worker.js'), {
        workerData: {statusDatabasePath, resultFolder, hocrTmpFolder}
    })

    worker.on('message', (msg) => {
        component.emit("workflow", msg);
        component.debug("[WORKER] message: %o", msg);
    });

    worker.on('error', (e) => {
        component.debug("[WORKER] error: %o", e);
    })
})