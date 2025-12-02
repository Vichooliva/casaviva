document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const adminContent = document.getElementById('admin-content');
    const loginError = document.getElementById('login-error');
    
    const propertiesList = document.getElementById('properties-list');
    const propertyForm = document.getElementById('property-form');
    const editIdInput = document.getElementById('edit-id');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const statusMessage = document.getElementById('status-message');
    const importBtn = document.getElementById('import-btn');

    // --- State ---
    let properties = [];

    // --- Login Logic ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        if (user === 'casaadmin1' && pass === 'Laclave1') {
            loginModal.style.display = 'none';
            adminContent.style.display = 'block';
            
            // Wait for Firebase to initialize then load data
            const checkDb = setInterval(() => {
                if (typeof db !== 'undefined') {
                    clearInterval(checkDb);
                    setupRealtimeListener();
                }
            }, 100);
        } else {
            loginError.style.display = 'block';
        }
    });

    // --- Import Logic ---
    if (importBtn) {
        importBtn.addEventListener('click', async () => {
            if (!confirm('¿Estás seguro de importar los datos iniciales? Esto agregará las propiedades del archivo JSON a la base de datos.')) return;
            
            importBtn.disabled = true;
            importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importando...';

            try {
                const response = await fetch('data/properties.json');
                if (!response.ok) throw new Error('No se pudo leer el archivo de datos iniciales.');
                
                const initialData = await response.json();
                
                const promises = initialData.map(prop => {
                    // Use the ID from JSON as the doc ID to preserve links if possible
                    const docRef = db.collection("properties").doc(String(prop.id));
                    return docRef.set({
                        ...prop,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });

                await Promise.all(promises);
                
                showStatus(`Se importaron ${initialData.length} propiedades exitosamente.`, 'success');
                importBtn.style.display = 'none';

            } catch (error) {
                console.error(error);
                showStatus('Error al importar: ' + error.message, 'error');
            } finally {
                importBtn.disabled = false;
                importBtn.innerHTML = '<i class="fas fa-file-import"></i> Importar Datos Iniciales';
            }
        });
    }

    // --- Firebase Realtime Listener ---
    function setupRealtimeListener() {
        propertiesList.innerHTML = '<p style="text-align: center; color: var(--primary-gold);"><i class="fas fa-spinner fa-spin"></i> Cargando datos...</p>';

        db.collection("properties").onSnapshot((querySnapshot) => {
            properties = [];
            querySnapshot.forEach((doc) => {
                properties.push({ id: doc.id, ...doc.data() });
            });
            renderPropertiesList();
        }, (error) => {
            console.error("Error getting documents: ", error);
            showStatus('Error al cargar datos: ' + error.message, 'error');
        });
    }

    // --- UI Functions ---
    function renderPropertiesList() {
        propertiesList.innerHTML = '';
        if (properties.length === 0) {
            propertiesList.innerHTML = '<p style="text-align: center;">No hay propiedades en la lista.</p>';
            if (importBtn) importBtn.style.display = 'block';
            return;
        } else {
            if (importBtn) importBtn.style.display = 'none';
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
                    <button onclick="editProperty('${prop.id}')" style="background: #2E7D32; color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px; font-weight: bold;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProperty('${prop.id}')" style="background: #c62828; color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px; font-weight: bold;">
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
        if (confirm('¿Estás seguro de borrar esta propiedad permanentemente?')) {
            db.collection("properties").doc(id).delete().then(() => {
                showStatus('Propiedad eliminada correctamente.', 'success');
            }).catch((error) => {
                console.error("Error removing document: ", error);
                showStatus('Error al eliminar: ' + error.message, 'error');
            });
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

        const imagesText = document.getElementById('images-input').value;
        const images = imagesText.split('\n').map(url => url.trim()).filter(url => url.length > 0);

        const propertyData = {
            title: document.getElementById('title').value,
            price: document.getElementById('price').value,
            location: document.getElementById('location').value,
            description: document.getElementById('description').value,
            images: images,
            status: document.getElementById('status').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const id = editIdInput.value;

        if (id) {
            // Update existing
            db.collection("properties").doc(id).update(propertyData).then(() => {
                showStatus('Propiedad actualizada correctamente.', 'success');
                resetForm();
            }).catch((error) => {
                console.error("Error updating document: ", error);
                showStatus('Error al actualizar: ' + error.message, 'error');
            });
        } else {
            // Add new
            propertyData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            db.collection("properties").add(propertyData).then(() => {
                showStatus('Propiedad creada correctamente.', 'success');
                resetForm();
            }).catch((error) => {
                console.error("Error adding document: ", error);
                showStatus('Error al crear: ' + error.message, 'error');
            });
        }
    });

    function resetForm() {
        propertyForm.reset();
        editIdInput.value = '';
        document.getElementById('form-title').textContent = 'Agregar / Editar Propiedad';
        cancelEditBtn.style.display = 'none';
    }
});            statusMessage.style.backgroundColor = 'rgba(46, 125, 50, 0.2)';
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