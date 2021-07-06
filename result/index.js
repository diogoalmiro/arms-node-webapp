const { pagination } = require("@webfocus/util");

const component = module.exports = require("@webfocus/component")("Result","Export PDF and Zip results.");
const fs = require("fs/promises")
const express = require("express")

component.staticApp = express.Router();
component.on("configuration", ({resultFolder}) => {
    component.staticApp.use(express.static(resultFolder))
    component.app.get("/", pagination(fs.readdir.bind(fs,resultFolder)))
})