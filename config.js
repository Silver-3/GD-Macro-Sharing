module.exports = {
    // -- Bot Configuration --
    token: process.env.token,
    sessionSecret: process.env.sessionSecret,
    clientSecret: process.env.clientSecret,
    devId: "857933376883654716",
    sendLogs: true,

    // -- Server ID --
    serverId: "1216309521819893900",

    // -- Channel IDs --
    channels: {
        gdr: "1321829383270436947",
        mhr: "1321828118595502090",
        re: "1321956143521595412",
        xd: "1321829630780375040",
        zbf: "1454410123312107655",
        welcome: "1321829878084931615",
        automod: "1216416794299076658",
        commands: "1311991195781697556",
    },

    // -- Role IDs --
    roles: {
        member: "1216312813199425596",
        announcement: "1296370955433545779",
        event: "1295496360648511620",
        eventManager: "1295973515916476436",
    },

    // -- Links --
    urls: {
        base: "http://45.61.162.33:8470/",
        invite: "https://discord.gg/H3vHJpz7Mj",
        oauth2: "https://discord.com/oauth2/authorize?client_id=1383593364582174790&response_type=code&redirect_uri=http%3A%2F%2F45.61.162.33%3A8470%2Fauth&scope=identify",
    },

    // -- Expected File Types --
    fileTypes: {
        gdr: ["gdr", "gdr2", "gdr.json"],
        mhr: ["mhr"],
        re: ["re", "re2", "re3"],
        xd: ["xd"],
        zbf: ["zbf"]
    }
};