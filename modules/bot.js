"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Eris = __importStar(require("eris"));
const fs = __importStar(require("mz/fs"));
const auth = JSON.parse(fs.readFileSync("config/auth.json", "utf8"));
const erisOpts = { maxShards: "auto" };
exports.bot = new Eris.Client(auth.token, erisOpts);
exports.bot.on("ready", () => {
    console.log("Logged in as %s - %s", exports.bot.user.username, exports.bot.user.id);
});
//# sourceMappingURL=bot.js.map