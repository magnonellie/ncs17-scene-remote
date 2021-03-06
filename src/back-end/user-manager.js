const moment = require("moment");
const jsonfile = require("jsonfile");

const jsonPath = require("path").resolve("./.users.json");

class TokenManager {
    constructor() {
        this.users = [];

        this.load();

        process.on("SIGINT", () => {
            this.save();
            process.exit();
        });
    }

    generateUser(ip) {
        const token = Math.floor(1000 + Math.random() * 9000);
        const user = new User(token, ip);
        this.users.push(user);
        return user;
    }

    validateUser(token, description, duration) {
        if (typeof duration !== "number" && !duration) {
            duration = 75;
        }
        const expirationTime = moment().add(parseInt(duration), "m");
        this._getUser(token).validate(description, expirationTime);
    }

    removeUser(token) {
        this.users.splice(this._getUserIndex(token), 1);
    }

    getValidUser(token, ip) {
        return this.users.find(user => {
            return user.token === token && user.ip === ip && user.valid;
        });
    }

    has(token) {
        return this._getUserIndex(token) >= 0;
    }

    save() {
        jsonfile.writeFileSync(jsonPath, this.users);
    }

    load() {
        try {
            this.users = jsonfile.readFileSync(jsonPath).map(user => new User(user));
        } catch (e) {}
    }

    _getUser(token) {
        return this.users.find(user => user.token === parseInt(token));
    }

    _getUserIndex(token) {
        return this.users.findIndex(user => user.token === parseInt(token));
    }
}

class User {
    constructor(token, ip) {
        if (typeof token === "object") {
            this.token = token.token;
            this.ip = token.ip;
            this.expirationTime = moment(token.expirationTime);
            this.description = token.description;
        } else {
            this.token = token;
            this.ip = ip;
            this.expirationTime = moment(0);
        }
    }

    get valid() {
        return moment().isBefore(this.expirationTime);
    }

    validate(description, expirationTime) {
        this.description = description;
        this.expirationTime = expirationTime;
    }
}

module.exports = new TokenManager();
