const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const config = require("./config.json");
const discordBot = require('./bot.js');
const client = discordBot.client;
discordBot.start();

const app = express();
const PORT = config.url.split(':').pop().replace('/', '');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

const macrosFolder = path.join(__dirname, "macros");
if (!fs.existsSync(macrosFolder)) {
  fs.mkdirSync(macrosFolder, { recursive: true });
}

const macrosFilePath = path.join(__dirname, "macros.json");
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

const extractUserID = (req) => {
  let userID = req.query.userID;
  if (!userID) {
    req.rawHeaders.forEach((header) => {
      if (header.startsWith(config.url)) {
        const extractedID = header.split("?userID=").pop();
        if (extractedID) {
          userID = extractedID;
        }
      }
    });
  }
  return userID;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userID = extractUserID(req);
    if (!userID) return cb(new Error("Invalid or missing user folder"));

    const userFolder = path.join(macrosFolder, userID);
    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true });
    }
    cb(null, userFolder);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.get("/submit-macro", (req, res) => {
  const userID = extractUserID(req);

  if (!userID) {
    return res.status(400).send("Missing user ID.");
  }

  const filePath = path.join(__dirname, "views", "submit-macro.html");
  const member = client.guilds.cache.get(config.server.serverId).members.cache.get(userID);

  try {
    const html = fs.readFileSync(filePath, "utf8");
    const newHTML = html
                    .replace("{{iconURL}}", member.user.displayAvatarURL())
                    .replace("{{userName}}", member.user.username);

    res.send(newHTML);
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    return res.status(500).send("Error loading page");
  }
});

app.post("/submit-macro", upload.single("macroFile"), (req, res) => {
  const { name, author, id, noclip = "no", notes } = req.body;
  const file = req.file;

  if (!file || !extractUserID(req)) {
    return res.status(400).send("Missing file or user ID.");
  }

  const safeName = name.replace(/ /g, "_");
  const fileInfo = {
    userID: extractUserID(req),
    id,
    name: safeName,
    author,
    originalFileName: file.originalname,
    filePath: file.path,
    size: (file.size / (1024 * 1024)).toFixed(2),
    type: path.extname(file.originalname).toLowerCase(),
    noclip: noclip == "on" ? "yes" : "no",
    notes,
    link: `${req.protocol}://${req.get("host")}/macros/${extractUserID(req)}/${safeName}`,
  };

  macros.uploads[`${extractUserID(req)}-${safeName}`] = fileInfo;
  saveMacros();

  client.emit("macroReceived", fileInfo);
  res.redirect(`/macro-submitted/${extractUserID(req)}`);
});

app.get("/download/:userID/:macroName", (req, res) => {
  const { userID, macroName } = req.params;

  const macroKey = `${userID}-${macroName}`;
  const macro = macros.downloads[macroKey];

  if (macro?.filePath && fs.existsSync(macro.filePath)) {
    res.download(macro.filePath);
  } else{
    res.status(404).send("File not found.");
  }
});

app.get("/macro-submitted/:userID", (req, res) => {
  const userID = req.params.userID;

  if (!userID) {
    return res.status(400).send("Missing user ID.");
  }

  const filePath = path.join(__dirname, "views", "macro-details.html");

  try {
    const html = fs.readFileSync(filePath, "utf8");
    const newHTML = html.replace(/{{link}}/g, `${config.url}submit-macro?userID=${userID}`);

    res.send(newHTML);
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    return res.status(500).send("Error loading page");
  }
});

app.listen(PORT, () => {
  console.log(`[INFO] Server is running at ${config.url}`);
});

module.exports.updateMacros = updateMacros;