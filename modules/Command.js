"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Eris = require("eris");
const fs = require("mz/fs");
class Command {
    constructor(names, func, condition) {
        this.names = names;
        this.func = func;
        if (condition) {
            this.condition = condition;
        }
        this.permPath = "./permissions/" + this.names[0] + ".json";
        try {
            this.permissions = require(this.permPath);
        }
        catch (_a) {
            this.permissions = {};
        }
    }
    async execute(msg, data) {
        if (this.isCanExecute(msg)) {
            this.func(msg, data);
        }
        else {
            throw new Error("Forbidden");
        }
    }
    async setPermission(guildID, channelID, roleID) {
        if (!(guildID in this.permissions)) {
            this.permissions[guildID] = {};
        }
        if (!(channelID in this.permissions[guildID])) {
            this.permissions[guildID][channelID] = [];
        }
        if (this.permissions[guildID][channelID].includes(roleID)) {
            this.permissions[guildID][channelID].splice(this.permissions[guildID][channelID].indexOf(roleID));
            if (!fs.existsSync("./permissions")) {
                await fs.mkdir("permissions");
            }
            await fs.writeFile(this.permPath, JSON.stringify(this.permissions, null, 4));
            return false;
        }
        else {
            this.permissions[guildID][channelID].push(roleID);
            if (!fs.existsSync("./permissions")) {
                await fs.mkdir("permissions");
            }
            await fs.writeFile(this.permPath, JSON.stringify(this.permissions, null, 4));
            return true;
        }
    }
    checkChannelPermissions(channelID, guild, rs) {
        if (rs && rs.length > 0) {
            // convert list of roleIDs to list of role objects
            const roles = rs.map(id => guild.roles.find(r => r.id === id));
            for (const role of roles) {
                if (this.permissions[guild.id][channelID].includes(role.id) || role.permissions.has("administrator")) {
                    return true;
                }
            }
            return false;
        }
        else {
            // if the user does not have a role, they cannot be in a role with permission
            return false;
        }
    }
    checkPermissions(msg) {
        const channel = msg.channel;
        if (channel instanceof Eris.TextChannel) {
            const guildID = channel.guild.id;
            const channelID = channel.id;
            const roles = msg.member && msg.member.roles;
            if (guildID in this.permissions) {
                if (channelID in this.permissions[guildID]) {
                    return this.checkChannelPermissions(channelID, channel.guild, roles);
                }
                else if ("default" in this.permissions[guildID]) {
                    // if the guild has permissions, but hasn't specified for this channel, check the defaults
                    return this.checkChannelPermissions("default", channel.guild, roles);
                }
                else {
                    // if there are no defaults, assume only allowed in explicit channels
                    return false;
                }
            }
            else {
                // if the guild has specified no permissions, allow everywhere
                return true;
            }
        }
        else {
            // if it's a DM, the user can go hog wild
            return true;
        }
    }
    isCanExecute(msg) {
        return this.checkPermissions(msg) && this.condition ? this.condition(msg) : true;
    }
}
exports.Command = Command;
//# sourceMappingURL=Command.js.map