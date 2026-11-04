import os
from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

# Chemin absolu vers la base de données SQLite
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, 'data', 'tasks.db')
os.makedirs(os.path.dirname(DATABASE), exist_ok=True)

def get_db_connection():
    """Crée et retourne une connexion à la base de données SQLite."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialise la base de données et crée la table tasks si elle n'existe pas."""
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            completed INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()


# Routes principales

@app.route('/')
def index():
    """Affiche la page principale de l'application."""
    return render_template('index.html')


@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Récupère toutes les tâches triées par date de création (plus récentes en premier)."""
    conn = get_db_connection()
    tasks = conn.execute('SELECT * FROM tasks ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(task) for task in tasks])


@app.route('/api/tasks', methods=['POST'])
def add_task():
    """Ajoute une nouvelle tâche."""
    data = request.get_json(silent=True) or {}
    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()

    if not title:
        return jsonify({'error': 'Le titre de la tâche est requis.'}), 400

    conn = get_db_connection()
    conn.execute(
        'INSERT INTO tasks (title, description) VALUES (?, ?)',
        (title, description)
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Tâche ajoutée avec succès.'}), 201


@app.route('/api/tasks/<int:task_id>/complete', methods=['POST'])
def complete_task(task_id):
    """Marque une tâche comme terminée (ou en cours)."""
    conn = get_db_connection()
    cursor = conn.execute(
        'UPDATE tasks SET completed = 1 - completed WHERE id = ?',
        (task_id,)
    )
    conn.commit()

    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Tâche introuvable.'}), 404

    conn.close()
    return jsonify({'success': True, 'message': 'Statut de la tâche mis à jour.'})


@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Supprime une tâche."""
    conn = get_db_connection()
    cursor = conn.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    conn.commit()

    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Tâche introuvable.'}), 404

    conn.close()
    return jsonify({'success': True, 'message': 'Tâche supprimée avec succès.'})


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=False)
