import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'dev.json');

interface DatabaseSchema {
  users: any[]; // Has {id, username, email, password, cookies, createdAt, updatedAt}
  sessions: any[];
  posts: any[];
  follows: any[];
  downloaderJobs: any[];
}

const defaultDb: DatabaseSchema = {
  users: [],
  sessions: [],
  posts: [],
  follows: [],
  downloaderJobs: [],
};

class JSONDatabase {
  public data: DatabaseSchema;

  constructor() {
    if (fs.existsSync(DB_FILE)) {
      try {
        this.data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch (e) {
        this.data = defaultDb;
      }
    } else {
      this.data = defaultDb;
      this.write();
    }
  }

  public write() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
  }
}

const db = new JSONDatabase();
export default db;
