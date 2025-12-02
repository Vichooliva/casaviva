document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const REPO_OWNER = 'Vichooliva';
    const REPO_NAME = 'casaviva';
    const FILE_PATH = 'data/properties.json';
    const BRANCH = 'main'; // or 'master' depending on your repo

    // --- DOM Elements ---
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const adminContent = document.getElementById('admin-content');
    const loginError = document.getElementById('login-error');
    
    const githubConfig = document.getElementById('github-config');
    const githubTokenInput = document.getElementById('github-token');
    const saveTokenBtn = document.getElementById('save-token-btn');
    const configBtn = document.getElementById('config-btn');
    const loadDataBtn = document.getElementById('load-data-btn');

    const propertiesList = document.getElementById('properties-list');
    const propertyForm = document.getElementById('property-form');
    const editIdInput = document.getElementById('edit-id');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const pushChangesBtn = document.getElementById('push-changes-btn');
    const statusMessage = document.getElementById('status-message');

    // --- State ---
    let properties = [];
    let fileSha = null; // Needed for GitHub API updates

    // --- Login Logic ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        if (user === 'casaadmin1' && pass === 'Laclave1') {
            loginModal.style.display = 'none';
            adminContent.style.display = 'block';
            checkGithubToken();
            loadPropertiesFromGitHub(); // Auto load on login
        } else {
            loginError.style.display = 'block';
        }
    });

    // --- GitHub Token Management ---
    function checkGithubToken() {
        const token = localStorage.getItem('github_token');
        if (!token) {
            githubConfig.style.display = 'block';
        } else {
            githubConfig.style.display = 'none';
        }
    }

    saveTokenBtn.addEventListener('click', () => {
        const token = githubTokenInput.value.trim();
        if (token) {
            localStorage.setItem('github_token', token);
            githubConfig.style.display = 'none';
            alert('Llave guardada correctamente.');
            loadPropertiesFromGitHub();
        }
    });

    configBtn.addEventListener('click', () => {
        githubConfig.style.display = githubConfig.style.display === 'none' ? 'block' : 'none';
    });

    loadDataBtn.addEventListener('click', loadPropertiesFromGitHub);

    // --- GitHub API Functions ---
    async function loadPropertiesFromGitHub() {
        const token = localStorage.getItem('github_token');
        if (!token) {
            propertiesList.innerHTML = '<p style="text-align: center; color: #ff6b6b;">Falta la llave de configuración (GitHub Token).</p>';
            return;
        }

        propertiesList.innerHTML = '<p style="text-align: center; color: var(--primary-gold);"><i class="fas fa-spinner fa-spin"></i> Cargando datos desde el servidor...</p>';

        try {
            const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) throw new Error('Error al conectar con GitHub: ' + response.statusText);

            const data = await response.json();
            fileSha = data.sha; // Save SHA for later update
            
            // Decode Base64 content (handling UTF-8)
            const content = decodeURIComponent(escape(atob(data.content)));
            properties = JSON.parse(content);
            
            renderPropertiesList();
            showStatus('Datos cargados exitosamente.', 'success');

        } catch (error) {
            console.error(error);
            propertiesList.innerHTML = `<p style="text-align: center; color: #ff6b6b;">Error: ${error.message}</p>`;
            showStatus('Error al cargar datos. Revisa tu llave o conexión.', 'error');
        }
    }

    async function saveToGitHub() {
        const token = localStorage.getItem('github_token');
        if (!token) {
            alert('No hay llave de configuración.');
            return;
        }

        if (!confirm('¿Estás seguro de publicar estos cambios en el sitio web?')) return;

        pushChangesBtn.disabled = true;
        pushChangesBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PUBLICANDO...';

        try {
            // Encode content to Base64 (handling UTF-8)
            const content = JSON.stringify(properties, null, 2);
            const encodedContent = btoa(unescape(encodeURIComponent(content)));

            const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: 'Actualización de propiedades desde Admin Panel',
                    content: encodedContent,
                    sha: fileSha, // Required to update existing file
                    branch: BRANCH
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || response.statusText);
            }

            const data = await response.json();
            fileSha = data.content.sha; // Update SHA for next save
            
            showStatus('¡Cambios publicados exitosamente! El sitio se actualizará en unos minutos.', 'success');
            alert('¡Éxito! Los cambios se han enviado. Espera unos minutos para verlos en la página.');

        } catch (error) {
            console.error(error);
            showStatus(`Error al publicar: ${error.message}`, 'error');
            alert(`Error al publicar: ${error.message}`);
        } finally {
            pushChangesBtn.disabled = false;
            pushChangesBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> PUBLICAR CAMBIOS EN EL SITIO';
        }
    }

    // --- UI Functions ---
    function renderPropertiesList() {
        propertiesList.innerHTML = '';
        if (properties.length === 0) {
            propertiesList.innerHTML = '<p style="text-align: center;">No hay propiedades en la lista.</p>';
            return;
        }

        properties.forEach(prop => {
            const item = document.createElement('div');
            item.className = 'property-list-item';
            item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #333; background: #1a1a1a; margin-bottom: 10px; border-radius: 5px;';
            
            item.innerHTML = `
                <div style="flex-grow: 1;">
                    <strong style="color: var(--primary-gold); font-size: 1.1rem;">${prop.title}</strong>
                    <div style="color: #888; font-size: 0.9rem; margin-top: 5px;">
                        <i class="fas fa-map-marker-alt"></i> ${prop.location} | 
                        <span style="color: var(--primary-green); font-weight: bold;">${prop.price}</span>
                        ${prop.status === 'sold' ? '<span style="background: #d32f2f; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; margin-left: 10px;">VENDIDA</span>' : ''}
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="editProperty(${prop.id})" style="background: #2E7D32; color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px; font-weight: bold;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProperty(${prop.id})" style="background: #c62828; color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px; font-weight: bold;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            propertiesList.appendChild(item);
        });
    }

    function showStatus(msg, type) {
        statusMessage.textContent = msg;
        statusMessage.style.display = 'block';
        if (type === 'success') {
            statusMessage.style.backgroundColor = 'rgba(46, 125, 50, 0.2)';
            statusMessage.style.color = '#4CAF50';
            statusMessage.style.border = '1px solid #4CAF50';
        } else {
            statusMessage.style.backgroundColor = 'rgba(198, 40, 40, 0.2)';
            statusMessage.style.color = '#ff6b6b';
            statusMessage.style.border = '1px solid #ff6b6b';
        }
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }

    // --- Form Handling ---
    window.editProperty = (id) => {
        const prop = properties.find(p => p.id === id);
        if (!prop) return;

        document.getElementById('title').value = prop.title;
        document.getElementById('price').value = prop.price;
        document.getElementById('location').value = prop.location;
        document.getElementById('description').value = prop.description;
        document.getElementById('status').value = prop.status;
        
        const images = prop.images || (prop.image ? [prop.image] : []);
        document.getElementById('images-input').value = images.join('\n');

        editIdInput.value = prop.id;
        document.getElementById('form-title').textContent = 'Editando: ' + prop.title;
        cancelEditBtn.style.display = 'inline-block';
        
        propertyForm.scrollIntoView({ behavior: 'smooth' });
    };

    window.deleteProperty = (id) => {
        if (confirm('¿Estás seguro de borrar esta propiedad?')) {
            properties = properties.filter(p => p.id !== id);
            renderPropertiesList();
            showStatus('Propiedad eliminada de la lista. Recuerda PUBLICAR CAMBIOS.', 'success');
        }
    };

    cancelEditBtn.addEventListener('click', () => {
        propertyForm.reset();
        editIdInput.value = '';
        document.getElementById('form-title').textContent = 'Agregar / Editar Propiedad';
        cancelEditBtn.style.display = 'none';
    });

    propertyForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = editIdInput.value ? parseInt(editIdInput.value) : Date.now();
        const imagesText = document.getElementById('images-input').value;
        const images = imagesText.split('\n').map(url => url.trim()).filter(url => url.length > 0);

        const newProp = {
            id: id,
            title: document.getElementById('title').value,
            price: document.getElementById('price').value,
            location: document.getElementById('location').value,
            description: document.getElementById('description').value,
            images: images,
            status: document.getElementById('status').value
        };

        if (editIdInput.value) {
            const index = properties.findIndex(p => p.id === id);
            if (index !== -1) properties[index] = newProp;
        } else {
            properties.push(newProp);
        }

        propertyForm.reset();
        editIdInput.value = '';
        document.getElementById('form-title').textContent = 'Agregar / Editar Propiedad';
        cancelEditBtn.style.display = 'none';

        renderPropertiesList();
        showStatus('Propiedad guardada en lista. Recuerda PUBLICAR CAMBIOS.', 'success');
    });

    pushChangesBtn.addEventListener('click', saveToGitHub);
});