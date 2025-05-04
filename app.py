from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

def init_db():
    with sqlite3.connect('journal.db') as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS journal (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()

@app.route("/intro")
def intro():
    return render_template("intro.html")

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/save_entry', methods=['POST'])
def save_entry():
    data = request.json
    corrupted = data.get('corrupted', '')

    with sqlite3.connect('journal.db') as conn:
        c = conn.cursor()
        c.execute('INSERT INTO journal (content) VALUES (?)', (corrupted,))
        conn.commit()

    return jsonify({'status': 'saved'})

@app.route('/load_entry')
def load_entry():
    with sqlite3.connect('journal.db') as conn:
        c = conn.cursor()
        c.execute('SELECT content FROM journal ORDER BY timestamp DESC LIMIT 1')
        row = c.fetchone()
    return jsonify({'content': row[0] if row else ''})

@app.route('/archive')
def archive():
    with sqlite3.connect('journal.db') as conn:
        c = conn.cursor()
        c.execute('SELECT content, timestamp FROM journal ORDER BY timestamp DESC')
        rows = c.fetchall()
    return jsonify([
        {'content': row[0], 'timestamp': row[1]} for row in rows
    ])

if __name__ == '__main__':
    init_db()
    app.run(debug=True)

