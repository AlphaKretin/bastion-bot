import * as Eris from "eris";
import * as fs from "fs";

interface IPermissionMap {
    [guildID: string]: {
        [channelID: string]: string[];
    };
}

export class Command {
    private names: string[];
    private func: (msg: Eris.Message) => Promise<void>;
    private condition?: (msg: Eris.Message) => boolean;
    private permPath: string;
    private permissions: IPermissionMap;
    constructor(
        names: string[],
        func: (msg: Eris.Message) => Promise<void>,
        condition?: (msg: Eris.Message) => boolean
    ) {
        this.names = names;
        this.func = func;
        if (condition) {
            this.condition = condition;
        }
        this.permPath = "./permissions/" + this.names[0] + ".json";
        try {
            this.permissions = require(this.permPath);
        } catch {
            this.permissions = {};
        }
    }

    public execute(msg: Eris.Message): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isCanExecute(msg)) {
                this.func(msg)
                    .then(() => resolve())
                    .catch(e => reject(e));
            } else {
                reject(new Error("Forbidden"));
            }
        });
    }

    public setPermission(guildID: string, channelID: string, roleID: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!(guildID in this.permissions)) {
                this.permissions[guildID] = {};
            }
            if (!(channelID in this.permissions[guildID])) {
                this.permissions[guildID][channelID] = [];
            }
            if (this.permissions[guildID][channelID].includes(roleID)) {
                this.permissions[guildID][channelID].splice(this.permissions[guildID][channelID].indexOf(roleID));
                fs.writeFile(this.permPath, JSON.stringify(this.permissions, null, 4), err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            } else {
                this.permissions[guildID][channelID].push(roleID);
                fs.writeFile(this.permPath, JSON.stringify(this.permissions, null, 4), err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    }

    private checkChannelPermissions(channelID: string, guild: Eris.Guild, rs: string[] | undefined): boolean {
        if (rs && rs.length > 0) {
            // convert list of roleIDs to list of role objects
            const roles = rs.map(id => guild.roles.find(r => r.id === id));
            // find the role with position equal to the highest position (at the start of an ascending sort)
            let role = roles.find((ro, _, o) => ro.position === o.map(r => r.position).sort()[0]);
            let roleID = role && role.id;
            // if the role doesn't have a permission listed, go down the member's roles until one does
            while (roleID && !this.permissions[guild.id][channelID].includes(roleID) && roles.length > 0) {
                if (role) {
                    roles.splice(roles.indexOf(role), 1);
                }
                role = roles.find((ro, _, o) => ro.position === o.map(r => r.position).sort()[0]);
                roleID = role && role.id;
            }
            return roleID ? this.permissions[guild.id][channelID].includes(roleID) : false;
        } else {
            // if the user does not have a role, they cannot be in a role with permission
            return false;
        }
    }

    private checkPermissions(msg: Eris.Message): boolean {
        const channel = msg.channel;
        if (channel instanceof Eris.TextChannel) {
            const guildID = channel.guild.id;
            const channelID = channel.id;
            const roles = msg.member && msg.member.roles;
            if (guildID in this.permissions) {
                if (channelID in this.permissions[guildID]) {
                    return this.checkChannelPermissions(channelID, channel.guild, roles);
                } else if ("default" in this.permissions[guildID]) {
                    // if the guild has permissions, but hasn't specified for this channel, check the defaults
                    return this.checkChannelPermissions("default", channel.guild, roles);
                } else {
                    // if there are no defaults, assume only allowed in explicit channels
                    return false;
                }
            } else {
                // if the guild has specified no permissions, allow everywhere
                return true;
            }
        } else {
            // if it's a DM, the user can go hog wild
            return true;
        }
    }
    private isCanExecute(msg: Eris.Message): boolean {
        return this.checkPermissions(msg) && this.condition ? this.condition(msg) : true;
    }
}
