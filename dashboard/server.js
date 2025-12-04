const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const axios = require('axios');
const path = require("path");
const fs = require("fs");
const db = require('../managers/database.js');

const botConfig = require('../config/bot.js');
const idConfig = require('../config/ids.js');
const linkConfig = require('../config/links.js');
const config = {
  ...botConfig,
  ...idConfig,
  ...linkConfig
};

const app = express();
const port = config.url.split(':').pop().replace('/', '');

const macrosFolder = path.join(__dirname, "../macros");
if (!fs.existsSync(macrosFolder)) {
  fs.mkdirSync(macrosFolder, {
    recursive: true
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadFolder = path.join(macrosFolder, "uploads");

    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, {
        recursive: true
      });
    }
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage
});

function getCookie(req, name) {
  const cookies = req.headers.cookie || "";
  const cookieArray = cookies.split(';');
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim();
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1);
    }
  }
  return "";
}

module.exports = (client) => {
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
  app.use(express.static(path.join(__dirname, "public")));

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "home.html"));
  });

  app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "auth.html"));
  });

  app.get('/sign-in', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "sign-in.html"));
  });

  app.get('/browse-macros', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "browse-macros.html"));
  });

  app.get("/submit-macro", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "submit-macro.html"));
  });

  app.post("/submit-macro", upload.single("macroFile"), (req, res) => {
    const userID = getCookie(req, "userId");

    const {
      name,
      author,
      id,
      noclip = "no",
      notes
    } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).send("Missing upload file");
    }

    let fileType = path.extname(file.originalname).toLowerCase();
    if (fileType == '.json') fileType = '.gdr';
    if (fileType == '.re2') fileType = '.re';

    const safeName = name.replace(/ /g, "_");
    const fileInfo = {
      userID: userID,
      id,
      name: safeName,
      author,
      originalFileName: file.originalname,
      filePath: file.path,
      size: (file.size / (1024 * 1024)).toFixed(2),
      type: fileType,
      noclip: noclip == "true" ? "yes" : "no",
      notes
    };

    client.emit("macroReceived", fileInfo);
    res.redirect('/macro-submitted');
  });

  app.get("/download/:channelId/:option", async (req, res) => {
    const channelId = req.params.channelId;
    const option = req.params.option;

    const macroFolder = path.join(__dirname, "..", "macros", channelId);

    if (option === "download") {
      if (!fs.existsSync(macroFolder)) return res.status(404).send("Macro folder not found.");

      const files = fs.readdirSync(macroFolder);
      if (files.length === 0) return res.status(404).send("No files found in macro folder.");

      const filePath = path.join(macroFolder, files[0]);

      return res.download(filePath, () => {});
    }

    if (option === "link") {
      if (fs.existsSync(macroFolder)) return res.send(`${config.url}download/${channelId}/download`);

      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (!channel) return res.status(404).send(`Macro thread not found: [${channelId}]`);

      const messages = await channel.messages.fetch({ limit: 2 });
      const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
      const message = Array.from(sorted.values())[1];

      if (!message) return res.status(404).send(`Macro message not found: [${channelId}]`);

      const attachment = message.attachments.first();
      if (!attachment) return res.status(404).send(`Macro attachment not found: [${channelId}]`);

      return res.send(attachment.url);
    }

    return res.status(404).send("Invalid option");
  });



  app.get("/macro-submitted", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "macro-submitted.html"));
  });

  app.get('/api/user/:userID', async (req, res) => {
    const userID = req.params.userID;

    try {
      const user = await client.users.fetch(userID);

      res.json({
        user
      });
    } catch (error) {
      res.status(404).json({
        error: 'User not found'
      });
    }
  });

  app.get('/api/macros', (req, res) => {
    const macros = db.all();
    res.json({
      macros
    });
  });

  app.get('/api/level/:levelID', async (req, res) => {
    const levelId = req.params.levelID;

    let response;

    try {
      response = await axios.get(`https://history.geometrydash.eu/api/v1/level/${encodeURIComponent(levelId)}/`, {
        timeout: 8000
      });
    } catch (error) {
      return res.json({
        error: "Level not found"
      });
    }

    if (response.status == 200 && response.data && response.data.sucess !== false) {
        const { records, cache_level_name, cache_username } = response.data;
	    const data = records.at(-1);

		return res.json({
  			name: data.level_name || cache_level_name,
  			author: data.username || cache_username
		});
    }

    return res.json({
      error: "Level not found"
    });
  });

  app.get('/api/oauth2', async (req, res) => {
    res.json({
      url: config.oauth2
    });
  });

  app.listen(port, () => {
    console.log(`[INFO] Server is running at ${config.url}`);
  });
}