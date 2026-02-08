
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../data/tinytask.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to sqlite database');
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            done INTEGER DEFAULT 0
        )`);
  }
});

export interface Task {
  id: number;
  title: string;
  done: boolean;
}

export const getTasks = (): Promise<Task[]> => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM tasks', (err, rows: any[]) => {
      if (err) {
        reject(err);
      } else {
        const tasks = rows.map(row => ({
          id: row.id,
          title: row.title,
          done: !!row.done
        }));
        resolve(tasks);
      }
    });
  });
};

export const addTask = (title: string): Promise<Task | null> => {
  return new Promise((resolve, reject) => {
    // BUG: The original bug was that empty strings were allowed if they weren't strictly empty.
    // But here we're implementing based on the previous implementation logic.
    // The previous implementation checked `if (!title) return null;`
    if (!title.trim()) {
      return resolve(null);
    }

    const sql = 'INSERT INTO tasks (title, done) VALUES (?, 0)';
    db.run(sql, [title], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          id: this.lastID,
          title: title,
          done: false
        });
      }
    });
  });
};

export const toggleTask = (id: number): Promise<Task | null> => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row: any) => {
      if (err) {
        reject(err);
        return;
      }
      if (!row) {
        resolve(null);
        return;
      }

      const newDone = !row.done;
      db.run('UPDATE tasks SET done = ? WHERE id = ?', [newDone ? 1 : 0, id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: row.id,
            title: row.title,
            done: newDone
          });
        }
      });
    });
  });
};

export const deleteTask = (id: number): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes > 0);
      }
    });
  });
};
