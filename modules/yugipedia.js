"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const errors_1 = require("./errors");
async function getYugipediaPage(query) {
    const YUGI_SEARCH = "https://yugipedia.com/api.php?action=opensearch&redirects=resolve" +
        "&prop=revisions&rvprop=content&format=json&formatversion=2&search=";
    const fullQuery = YUGI_SEARCH + encodeURIComponent(query);
    try {
        const yugiData = await (await node_fetch_1.default(fullQuery)).json();
        if (yugiData[3][0]) {
            return yugiData[3][0];
        }
        else {
            throw new Error(errors_1.Errors.ERROR_YUGI_API);
        }
    }
    catch (e) {
        throw new Error(errors_1.Errors.ERROR_YUGI_API);
    }
}
exports.getYugipediaPage = getYugipediaPage;
async function getYugipediaContent(query, prop) {
    const YUGI_API = "https://yugipedia.com/api.php?action=query&redirects=true" +
        "&prop=revisions&rvprop=content&format=json&formatversion=2&titles=";
    const fullQuery = YUGI_API + encodeURIComponent(query);
    try {
        const yugiData = await (await node_fetch_1.default(fullQuery)).json();
        const page = yugiData.query.pages[0].revisions[0].content;
        if (!prop) {
            return page;
        }
        const propReg = new RegExp("\\| " + prop + "\\s+= (.+?)\\n");
        const regRes = propReg.exec(page);
        if (regRes) {
            return regRes[1];
        }
        throw new Error(errors_1.Errors.ERROR_YUGI_REGEX);
    }
    catch (e) {
        throw new Error(errors_1.Errors.ERROR_YUGI_API);
    }
}
exports.getYugipediaContent = getYugipediaContent;
//# sourceMappingURL=yugipedia.js.map