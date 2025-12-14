const SqliteDatabase = require("better-sqlite3");

class Database {
    constructor(path = "macros.db") {
        this.path = path;
        this.db = null;
    }

    connect() {
        this.db = new SqliteDatabase(this.path);

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS macros (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                author TEXT NOT NULL,
                levelId TEXT NOT NULL,
                noclip TEXT NOT NULL,
                notes TEXT,
                type TEXT NOT NULL,
                channelId TEXT,
                userId TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("[Database] Connected to SQLite");
        return this;
    }

    push(macro) {
        if (!this.db) throw new Error("Database not connected");

        const insert = this.db.prepare(`
            INSERT INTO macros (name, author, levelId, noclip, notes, type, channelId, userId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insert.run(
            macro.name,
            macro.author,
            macro.levelId,
            macro.noclip,
            macro.notes,
            macro.type,
            macro.channelId,
            macro.userId
        );

        return true;
    }

    all() {
        if (!this.db) throw new Error("Database not connected!");

        const stmt = this.db.prepare(`SELECT * FROM macros ORDER BY id DESC`);
        const rows = stmt.all();

        return rows.map(row => ({
            ...row
        }));
    }

    delete(channelId) {
        if (!this.db) throw new Error("Database not connected!");

        const stmt = this.db.prepare(`DELETE FROM macros WHERE channelId = ?`);
        return stmt.run(channelId);
    }

    get(channelId) {
        if (!this.db) throw new Error("Database not connected!");

        const stmt = this.db.prepare(`SELECT * FROM macros WHERE channelId = ?`);
        return stmt.get(channelId);
    }

    change(channelId, column, newValue) {
        if (!this.db) throw new Error("Database not connected!");

        const allowedColumns = ['name', 'author', 'levelId', 'noclip', 'notes', 'type', 'userId'];
        if (!allowedColumns.includes(column)) throw new Error(`Invalid column: '${column}'. Allowed updates: ${allowedColumns.join(', ')}`);

        const stmt = this.db.prepare(`UPDATE macros SET "${column}" = ? WHERE channelId = ?`);
        const info = stmt.run(newValue, channelId);

        return info.changes > 0;
    }
}

module.exports = new Database();