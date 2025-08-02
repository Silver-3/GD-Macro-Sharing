const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const botConfig = require('../config/bot.js');
const idConfig = require('../config/ids.js');
const linkConfig = require('../config/links.js');
const config = { ...botConfig, ...idConfig, ...linkConfig };

const app = express();
const port = config.url.split(':').pop().replace('/', '');

const macrosFolder = path.join(__dirname, "../macros");
if (!fs.existsSync(macrosFolder)) {
  fs.mkdirSync(macrosFolder, { recursive: true });
}

const macrosFilePath = path.join(__dirname, "../macros.json");
let macros = {};

if (fs.existsSync(macrosFilePath)) {
  const data = fs.readFileSync(macrosFilePath, "utf8");
  macros = JSON.parse(data);
}

const saveMacros = () => {
  fs.writeFileSync(macrosFilePath, JSON.stringify(macros, null, 2));
  macros = JSON.parse(fs.readFileSync(macrosFilePath, "utf8"));
};

const updateMacros = (macrosA) => {
  fs.writeFileSync(macrosFilePath, JSON.stringify(macrosA, null, 2));
  macros = JSON.parse(fs.readFileSync(macrosFilePath, "utf8"));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userID = getCookie(req, "userId");
    if (!userID) return cb(new Error("Invalid or missing user folder"));

    const userFolder = path.join(macrosFolder, userID);
    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, {
        recursive: true
      });
    }
    cb(null, userFolder);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

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
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(express.static(path.join(__dirname, "public")));

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "homepage.html"));
  });

  app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "auth.html"));
  });

  app.get("/submit-macro", (req, res) => {
    const userID = getCookie(req, "userId");

    if (!userID) {
      return res.redirect('/');
    }

    res.sendFile(path.join(__dirname, "views", "submit-macro.html"));
  });

  app.post("/submit-macro", upload.single("macroFile"), (req, res) => {
    const userID = getCookie(req, "userId");

    if (!userID) {
      return res.redirect('/');
    }

    const { name, author, id, noclip="no", notes } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).send("Missing upload file");
    }

    const safeName = name.replace(/ /g, "_");
    const fileInfo = {
      userID: userID,
      id,
      name: safeName,
      author,
      originalFileName: file.originalname,
      filePath: file.path,
      size: (file.size / (1024 * 1024)).toFixed(2),
      type: path.extname(file.originalname).toLowerCase(),
      noclip: noclip == "on" ? "yes" : "no",
      notes,
      link: `${req.protocol}://${req.get("host")}/macros/${userID}/${safeName}`,
    };

    macros.uploads[`${userID}-${safeName}`] = fileInfo;
    saveMacros();

    client.emit("macroReceived", fileInfo);
    res.redirect('/macro-submitted');
  });

  app.get("/download/:userID/:macroName", (req, res) => {
    const userID = req.params.userID;
    const macroName = req.params.macroName;

    const macroKey = `${userID}-${macroName}`;
    const macro = macros.downloads[macroKey];

    if (macro?.filePath && fs.existsSync(macro.filePath)) {
      res.download(macro.filePath);
    } else {
      res.status(404).send("File not found.");
    }
  });

  app.get("/macro-submitted", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "macro-submitted.html"));
  });

  app.get('/api/user/:userID', async (req, res) => {
    const userID = req.params.userID;

    try {
      const user = await client.users.fetch(userID);

      res.json({ user });
    } catch (error) {
      res.status(404).json({
        error: 'User not found'
      });
    }
  });

  app.listen(port, () => {
    console.log(`[INFO] Server is running at ${config.url}`);
  });
}

module.exports.updateMacros = updateMacros;