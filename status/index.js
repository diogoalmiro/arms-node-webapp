const { pagination } = require("@webfocus/util");
const Database = require("better-sqlite3");
const fs = require("fs")

const component = module.exports = require("@webfocus/component")("Status","See progress and queue of workflow.");

component.on("configuration", ({uploadFolder, statusDatabasePath}) => {
    const db = new Database(statusDatabasePath);

    const status = db.prepare("SELECT * FROM workflow")
    component.app.get("/", pagination(async () => status.all()))
})

