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
        cml: "1502442560638025768",
        gdr: "1321829383270436947",
        gdr2: "1477232439570075650",
        mhr: "1321828118595502090",
        re: "1321956143521595412",
        slc: "1484104379354320896",
        tcm: "1484104396315951221",
        ttr: "1499635886990692442",
        xd: "1321829630780375040",
        zbf: "1454410123312107655",
        welcome: "1321829878084931615",
        automod: "1216416794299076658",
        commands: "1311991195781697556",
        chats: ["1216316500130926633", "1216311806218338314", "1216411822236766332", "1311991195781697556", "1321831005652385812"]
    },

    // -- Role IDs --
    roles: {
        member: "1216312813199425596",
        announcement: "1296370955433545779",
        event: "1295496360648511620",
        eventManager: "1295973515916476436",
        img: "1493080230774964315"
    },

    // -- Links --
    urls: {
        full: "https://gd.584924.xyz/",
        base: "gd.584924.xyz",
        port: 9103,
        invite: "https://discord.gg/H3vHJpz7Mj",
        oauth2: "https://discord.com/oauth2/authorize?client_id=1383593364582174790&response_type=code&redirect_uri=https%3A%2F%2Fgd.584924.xyz%2Fauth&scope=identify",
    },

    // -- Expected File Types --
    fileTypes: {
        cml: ["cml"],
        gdr: ["gdr", "gdr.json"],
        gdr2: ["gdr2"],
        mhr: ["mhr"],
        re: ["re", "re2", "re3"],
        slc: ["slc"],
        tcm: ["tcm"],
        ttr: ["ttr"],
        xd: ["xd"],
        zbf: ["zbf"]
    }
};