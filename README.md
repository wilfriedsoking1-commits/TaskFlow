# TaskFlow - Application de gestion de tâches

TaskFlow est une application web simple et moderne pour gérer vos tâches au quotidien. Elle permet d'ajouter, afficher, terminer et supprimer des tâches.

## 🚀 Fonctionnalités

- Ajouter une nouvelle tâche avec titre et description
- Afficher la liste de toutes les tâches
- Marquer une tâche comme terminée / en cours
- Supprimer une tâche
- Interface moderne et responsive (mobile, tablette, desktop)
- Stockage des données dans SQLite (persistant via volume Docker)

## 🛠️ Stack technique

- **Backend** : Python, Flask, SQLite
- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Conteneurisation** : Docker

## 📂 Structure du projet

```
TaskFlow/
├── app.py                 # Application Flask
├── requirements.txt       # Dépendances Python
├── Dockerfile             # Image Docker
├── .dockerignore          # Fichiers ignorés par Docker
├── .gitignore             # Fichiers ignorés par Git
├── README.md              # Documentation
├── tasks.db               # Base de données SQLite (créée automatiquement)
├── templates/
│   └── index.html         # Template HTML principal
└── static/
    ├── css/
    │   └── style.css      # Feuille de styles
    └── js/
        └── app.js         # Logique JavaScript frontend
```

## ▶️ Lancement en local (sans Docker)

1. Cloner le dépôt :
   ```bash
   git clone <url-du-depot>
   cd TaskFlow
   ```

2. Créer et activer un environnement virtuel :
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux / macOS
   source venv/bin/activate
   ```

3. Installer les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

4. Lancer l'application :
   ```bash
   python app.py
   ```

5. Ouvrir votre navigateur à l'adresse : http://localhost:5000

## 🐳 Lancement avec Docker

### Construire l'image

```bash
docker build -t taskflow .
```

### Exécuter le conteneur avec un volume pour la persistance des données

```bash
docker run -d \
  --name taskflow \
  -p 5000:5000 \
  -v taskflow_data:/app/tasks.db \
  taskflow
```

L'application sera accessible à l'adresse : http://localhost:5000

### Avec Docker Compose (optionnel)

Si vous disposez d'un fichier `docker-compose.yml` :

```bash
docker compose up --build
```

### Arrêter et supprimer le conteneur

```bash
docker stop taskflow
docker rm taskflow
```

### Supprimer le volume de données (perd toutes les tâches)

```bash
docker volume rm taskflow_data
```

## 📡 API REST

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/tasks` | Récupère toutes les tâches |
| POST | `/api/tasks` | Ajoute une tâche |
| POST | `/api/tasks/<id>/complete` | Bascule le statut terminée/en cours |
| DELETE | `/api/tasks/<id>` | Supprime une tâche |

## 📄 Licence

Ce projet est sous licence MIT.

---
⚠️ **Important** : Ce projet ne sera pas publié sur GitHub sans votre confirmation explicite.
