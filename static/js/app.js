/**
 * TaskFlow - Logique JavaScript frontend
 * Gère l'affichage, l'ajout, la complétion et la suppression des tâches via l'API REST.
 */

const API_BASE = '/api/tasks';

// Éléments DOM
const taskForm = document.getElementById('addTaskForm');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescriptionInput = document.getElementById('taskDescription');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const formError = document.getElementById('formError');

// Éléments statistiques
const totalTasksEl = document.getElementById('totalTasks');
const completedTasksEl = document.getElementById('completedTasks');
const pendingTasksEl = document.getElementById('pendingTasks');

// Bouton supprimer les terminées
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

// État local des tâches
let tasks = [];

/**
 * Récupère toutes les tâches depuis l'API et met à jour l'interface.
 */
async function fetchTasks() {
    try {
        const response = await fetch(API_BASE, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des tâches.');
        }

        tasks = await response.json();
        renderTasks();
    } catch (error) {
        console.error(error);
        showFormError('Impossible de charger les tâches. Vérifiez que le serveur est démarré.');
    }
}

/**
 * Ajoute une nouvelle tâche via l'API.
 * @param {Event} event - Événement de soumission du formulaire
 */
async function addTask(event) {
    event.preventDefault();

    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();

    if (!title) {
        showFormError('Le titre de la tâche est requis.');
        taskTitleInput.focus();
        return;
    }

    hideFormError();

    // État de chargement du bouton
    const addBtn = taskForm.querySelector('button[type="submit"]');
    const originalBtnText = addBtn.textContent;
    addBtn.disabled = true;
    addBtn.textContent = 'Ajout...';

    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Erreur lors de l\'ajout de la tâche.');
        }

        await response.json();

        // Réinitialiser le formulaire
        taskForm.reset();
        taskTitleInput.focus();

        // Recharger les tâches
        await fetchTasks();
    } catch (error) {
        console.error(error);
        showFormError(error.message);
    } finally {
        addBtn.disabled = false;
        addBtn.textContent = originalBtnText;
    }
}

/**
 * Bascule le statut terminée/en cours d'une tâche.
 * @param {number} taskId - ID de la tâche
 */
async function toggleTaskCompletion(taskId) {
    try {
        const response = await fetch(`${API_BASE}/${taskId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour de la tâche.');
        }

        await response.json();
        await fetchTasks();
    } catch (error) {
        console.error(error);
        showFormError('Erreur lors de la mise à jour de la tâche.');
    }
}

/**
 * Supprime une tâche via l'API.
 * @param {number} taskId - ID de la tâche
 */
async function deleteTask(taskId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/${taskId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression de la tâche.');
        }

        await response.json();
        await fetchTasks();
    } catch (error) {
        console.error(error);
        showFormError('Erreur lors de la suppression de la tâche.');
    }
}

/**
 * Supprime toutes les tâches terminées.
 */
async function clearCompletedTasks() {
    const completed = tasks.filter(t => t.completed === 1 || t.completed === true);

    if (completed.length === 0) {
        showFormError('Aucune tâche terminée à supprimer.');
        return;
    }

    if (!confirm(`Voulez-vous vraiment supprimer ${completed.length} tâche(s) terminée(s) ?`)) {
        return;
    }

    try {
        // Supprimer chaque tâche terminée une par une (l'API ne supporte pas la suppression en lot)
        for (const task of completed) {
            await fetch(`${API_BASE}/${task.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await fetchTasks();
    } catch (error) {
        console.error(error);
        showFormError('Erreur lors de la suppression des tâches terminées.');
    }
}

/**
 * Affiche les tâches dans le DOM et met à jour les statistiques.
 */
function renderTasks() {
    // Vider la liste
    taskList.innerHTML = '';

    // Mettre à jour les statistiques
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed === 1 || t.completed === true).length;
    const pending = total - completed;

    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    pendingTasksEl.textContent = pending;

    // Afficher ou masquer l'état vide
    if (total === 0) {
        emptyState.style.display = 'block';
        clearCompletedBtn.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        clearCompletedBtn.style.display = 'inline-block';
    }

    // Créer et ajouter chaque élément de tâche
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${isCompleted(task) ? 'completed' : ''}`;
        li.dataset.id = task.id;

        const isDone = isCompleted(task);

        li.innerHTML = `
            <div class="task-info">
                <span class="task-title">${escapeHtml(task.title || '')}</span>
                ${task.description ? `<span class="task-description">${escapeHtml(task.description)}</span>` : ''}
            </div>
            <div class="task-actions">
                <button class="btn-complete ${isDone ? 'completed' : ''}" aria-label="${isDone ? 'Marquer comme en cours' : 'Marquer comme terminée'}">
                    ${isDone ? '↩' : '✓'}
                </button>
                <button class="btn-delete" aria-label="Supprimer la tâche">
                    🗑️
                </button>
            </div>
        `;

        // Écouteurs d'événements
        const btnComplete = li.querySelector('.btn-complete');
        const btnDelete = li.querySelector('.btn-delete');

        btnComplete.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTaskCompletion(task.id);
        });

        btnDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });

        taskList.appendChild(li);
    });
}

/**
 * Vérifie si une tâche est terminée.
 * @param {Object} task - Objet tâche
 * @returns {boolean}
 */
function isCompleted(task) {
    return task.completed === 1 || task.completed === true;
}

/**
 * Échappe les caractères HTML pour éviter les injections XSS.
 * @param {string} text - Texte à échapper
 * @returns {string}
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Affiche un message d'erreur dans le formulaire.
 * @param {string} message - Message d'erreur
 */
function showFormError(message) {
    formError.textContent = message;
    formError.style.display = 'block';
}

/**
 * Masque le message d'erreur.
 */
function hideFormError() {
    formError.textContent = '';
    formError.style.display = 'none';
}

/**
 * Initialise l'application au chargement de la page.
 */
function init() {
    fetchTasks();

    taskForm.addEventListener('submit', addTask);

    if (clearCompletedBtn) {
        clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    }
}

// Démarrer l'application lorsque le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
