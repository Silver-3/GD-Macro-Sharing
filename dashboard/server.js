const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const axios = require('axios');
const path = require("path");
const fs = require("fs");
const session = require('express-session');
const fileStore = require('session-file-store')(session);

const db = require('../handlers/database.js');
const config = require('../config.js');

const app = express();
const port = config.urls.base.split(':').pop().replace('/', '');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  store: new fileStore({
    path: './sessions',
    retries: 0,
    logFn: function() {}
  }),
  secret: config.sessionSecret,
  resave: true,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

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

async function fetchLevel(levelId) {
  try {
    const response = await axios.get(`https://history.geometrydash.eu/api/v1/level/${encodeURIComponent(levelId)}/`, {
      timeout: 8000
    });

    if (response.status === 200 && response.data && response.data.sucess !== false) {
      const data = response.data.records.at(-1);

      return {
        found: true,
        name: response.data.cache_level_name || data.level_name,
        author: response.data.cache_username || data.username
      };
    }
  } catch (error) {
    return {
      found: false
    };
  }

  return {
    found: false
  };
}

async function tallyMacros() {
  const rows = await db.all();
  const counts = new Map();

  for (const row of rows) {
    const uid = row.userId || row.userID;
    if (!uid) continue;

    counts.set(uid, (counts.get(uid) || 0) + 1);
  }
  return counts;
}

module.exports.run = (client) => {
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  app.use(bodyParser.json());
  app.use(express.static(path.join(__dirname, "public")));

  // -- Website Routes --

  app.get('/', (req, res) => {
    res.render('home');
  });

  app.get('/auth', (req, res) => {
    res.render('auth');
  });

  app.get('/sign-in', (req, res) => {
    res.render('sign-in');
  });

  app.get('/browse-macros', (req, res) => {
    res.render('browse-macros');
  });

  app.get("/submit-macro", (req, res) => {
    const userID = req.session.userId;

    if (!userID) {
      return res.render('submit-macro', {
        showLoginModal: true
      });
    }

    res.render('submit-macro', {
      showLoginModal: false
    });
  });

  app.get("/macro-submitted", (req, res) => {
    res.render('macro-submitted');
  });

  app.post("/submit-macro", upload.single("macroFile"), async (req, res) => {
    const userID = req.session.userId;

    let {
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

    if (name == 'Not Found' && author == 'Unknown') {
      console.log(`Macro name and author is unknown, fetching level data...`);
      const data = await fetchLevel(id);

      if (data && data.found && data.name && data.author) {
        name = data.name;
        author = data.author;

        console.log(`Successfully fetched level: ${name} by ${author}`);
      } else {
        console.log(`Error: Level data not found or invalid from API.`);
      }
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

    if (option === "link") {
      if (fs.existsSync(macroFolder)) return res.send(`${config.urls.base}download/${channelId}/download`);

      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (!channel) return res.status(404).send(`Macro thread not found: [${channelId}]`);

      const messages = await channel.messages.fetch({
        limit: 10
      });
      const message = messages.find(msg => msg.attachments.size > 0);

      if (!message) return res.status(404).send(`Macro attachment not found: [${channelId}]`);

      const attachment = message.attachments.first();
      return res.send(attachment.url);
    } else {
      if (!fs.existsSync(macroFolder)) return res.status(404).send("Macro folder not found. Try run /updated-button in discord");

      const files = fs.readdirSync(macroFolder);
      if (files.length === 0) return res.status(404).send("No files found in macro folder.");

      const filePath = path.join(macroFolder, files[0]);

      return res.download(filePath, () => {});
    }
  });

  // -- API Routes --

  app.get('/api/me', async (req, res) => {
    if (!req.session.userId) {
      return res.json({
        user: null
      });
    }

    try {
      const user = await client.users.fetch(req.session.userId);
      res.json({
        user
      });
    } catch (error) {
      res.json({
        user: null
      });
    }
  });

  app.get('/api/logout', (req, res) => {
    req.session.destroy((error) => {
      if (error) {
        console.log(`[ERROR] Logout error: `, error);
        return res.status(500).json({ success: false, errror: "Could not log out" });
      }

      res.clearCookie('connect.sid');
      res.json({ success: true });
    })
  });

  app.get('/api/users/:userID', async (req, res) => {
    const userId = req.params.userID;

    try {
      const user = await client.users.fetch(userId);
      res.json({
        user
      });
    } catch (error) {
      res.json({
        user: null
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
    const data = await fetchLevel(levelId);

    if (data.found) {
      res.json({
        name: data.name,
        author: data.author
      });
    } else {
      res.json({
        error: "Level not found"
      });
    }
  });

  app.get('/api/oauth2', (req, res) => {
    res.json({
      url: config.urls.oauth2
    });
  });

  app.get('/api/config', (req, res) => {
    res.json({
      serverId: config.serverId,
      channels: config.channels,
      roles: config.roles
    });
  });

  app.get('/api/fileTypes', (req, res) => {
    res.json(config.fileTypes);
  });

  app.get('/api/login-session', (req, res) => {
    const {
      userId
    } = req.body;
    if (!userId) return res.status(400).send("No user ID found");

    req.session.userId = userId;
    res.json({
      sucess: true
    });
  });

  app.post('/api/auth/callback', async (req, res) => {
    const {
      code
    } = req.body;

    try {
      const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
        client_id: client.user.id,
        client_secret: config.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.urls.base + 'auth',
      }).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const accessToken = tokenResponse.data.access_token;

      const userResponse = await axios.get('https://discord.com/api/users/@me', {
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      req.session.userId = userResponse.data.id;
      res.json({
        success: true
      });
    } catch (error) {
      console.error("[ERROR] Discord Auth Error:", error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: "Authentication failed"
      });
    }
  });

  app.get('/api/leaderboard', async (req, res) => {
    try {
      const counts = await tallyMacros();

      const sorted = [...counts.entries()]
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      const totalMacros = [...counts.values()].reduce((a, b) => a + b, 0);

      const leaderboard = await Promise.all(sorted.map(async ([userID, total]) => {
        try {
          const user = await client.users.fetch(userID);
          return {
            username: user.globalName || user.username,
            avatar: user.displayAvatarURL({
              size: 64
            }),
            count: total,
            isMe: userID === req.session.userId
          };
        } catch {
          return {
            username: "Unknown User",
            avatar: null,
            count: total,
            isMe: false
          };
        }
      }));

      res.json({
        leaderboard,
        totalMacros
      });
    } catch (error) {
      console.error("Leaderboard API Error:", error);
      res.status(500).json({
        error: "Failed to load leaderboard"
      });
    }
  });

  app.listen(port, () => {
    console.log(`[INFO] Server is running at ${config.urls.base}`);
  });
}

module.exports.fetchLevel = fetchLevel;