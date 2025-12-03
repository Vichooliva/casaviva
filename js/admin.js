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
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const toggleUrlInputBtn = document.getElementById('toggle-url-input');
    const imagesInput = document.getElementById('images-input');

    // --- State ---
    let properties = [];
    let currentImages = []; // Array to hold image URLs/Base64 for the current form
    let map, marker; // Leaflet map and marker

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
                    initMap(); // Initialize map after login
                }
            }, 100);
        } else {
            loginError.style.display = 'block';
        }
    });

    // --- Map Logic ---
    function initMap() {
        // Default to Santiago
        const defaultLat = -33.4489;
        const defaultLng = -70.6693;

        map = L.map('admin-map').setView([defaultLat, defaultLng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

        // Update inputs on drag
        marker.on('dragend', function(e) {
            const position = marker.getLatLng();
            updateLatLngInputs(position.lat, position.lng);
        });

        // Update marker on map click
        map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            updateLatLngInputs(e.latlng.lat, e.latlng.lng);
        });

        // Search functionality
        document.getElementById('map-search-btn').addEventListener('click', searchLocation);
        document.getElementById('map-search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchLocation();
            }
        });
    }

    function updateLatLngInputs(lat, lng) {
        document.getElementById('lat').value = lat.toFixed(6);
        document.getElementById('lng').value = lng.toFixed(6);
    }

    function searchLocation() {
        const query = document.getElementById('map-search-input').value;
        if (!query) return;

        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    
                    map.setView([lat, lon], 15);
                    marker.setLatLng([lat, lon]);
                    updateLatLngInputs(lat, lon);
                } else {
                    alert('Ubicación no encontrada');
                }
            })
            .catch(err => {
                console.error(err);
                alert('Error al buscar ubicación');
            });
    }

    // --- Toggle URL Input ---
    toggleUrlInputBtn.addEventListener('click', () => {
        if (imagesInput.style.display === 'none') {
            imagesInput.style.display = 'block';
            toggleUrlInputBtn.textContent = 'Ocultar URLs manuales';
        } else {
            imagesInput.style.display = 'none';
            toggleUrlInputBtn.textContent = 'Ver/Editar URLs manualmente';
        }
    });

    // --- Image Handling ---
    window.renderImagePreviews = () => {
        imagePreviewContainer.innerHTML = '';
        currentImages.forEach((url, index) => {
            const div = document.createElement('div');
            div.style.cssText = 'position: relative; border: 1px solid #444; border-radius: 4px; overflow: hidden; aspect-ratio: 1;';
            
            const img = document.createElement('img');
            img.src = url;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
            
            const actions = document.createElement('div');
            actions.style.cssText = 'position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: space-between; padding: 5px;';
            
            const coverBtn = document.createElement('button');
            coverBtn.innerHTML = index === 0 ? '★' : '☆';
            coverBtn.title = 'Hacer Portada';
            coverBtn.type = 'button';
            coverBtn.style.cssText = `background: none; border: none; color: ${index === 0 ? '#FFD700' : '#fff'}; cursor: pointer; font-size: 1.2rem;`;
            coverBtn.onclick = () => setCoverImage(index);

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑';
            deleteBtn.title = 'Eliminar';
            deleteBtn.type = 'button';
            deleteBtn.style.cssText = 'background: none; border: none; color: #ff6b6b; cursor: pointer;';
            deleteBtn.onclick = () => removeImage(index);

            actions.appendChild(coverBtn);
            actions.appendChild(deleteBtn);
            div.appendChild(img);
            div.appendChild(actions);
            imagePreviewContainer.appendChild(div);
        });
        
        // Sync with textarea
        imagesInput.value = currentImages.join('\n');
    };

    window.setCoverImage = (index) => {
        if (index === 0) return;
        const img = currentImages.splice(index, 1)[0];
        currentImages.unshift(img);
        renderImagePreviews();
    };

    window.removeImage = (index) => {
        currentImages.splice(index, 1);
        renderImagePreviews();
    };

    // Handle File Selection
    document.getElementById('image-upload').addEventListener('change', async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;

        const statusSpan = document.getElementById('upload-status');
        statusSpan.textContent = 'Procesando...';

        try {
            for (let i = 0; i < files.length; i++) {
                const base64 = await compressImage(files[i]);
                currentImages.push(base64);
            }
            renderImagePreviews();
            statusSpan.textContent = '';
        } catch (error) {
            console.error(error);
            statusSpan.textContent = 'Error al procesar imagen.';
        }
        
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    });

    // Sync manual URL input changes to preview
    imagesInput.addEventListener('change', () => {
        const urls = imagesInput.value.split('\n').map(u => u.trim()).filter(u => u.length > 0);
        currentImages = urls;
        renderImagePreviews();
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
                        ${prop.status === 'pending' ? '<span style="background: #FF9800; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; margin-left: 10px;">PENDIENTE</span>' : ''}
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
        document.getElementById('operation').value = prop.operation || 'venta';
        document.getElementById('currency').value = prop.currency || 'UF';
        document.getElementById('price').value = prop.price;
        document.getElementById('location').value = prop.location;
        document.getElementById('lat').value = prop.lat || '';
        document.getElementById('lng').value = prop.lng || '';
        document.getElementById('description').value = prop.description;
        document.getElementById('status').value = prop.status;
        
        // Load images into state
        currentImages = prop.images || (prop.image ? [prop.image] : []);
        renderImagePreviews();

        editIdInput.value = prop.id;
        document.getElementById('form-title').textContent = 'Editando: ' + prop.title;
        cancelEditBtn.style.display = 'inline-block';
        
        // Update map position
        if (prop.lat && prop.lng && map && marker) {
            const lat = parseFloat(prop.lat);
            const lng = parseFloat(prop.lng);
            map.setView([lat, lng], 15);
            marker.setLatLng([lat, lng]);
        }
        
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
        resetForm();
    });

    propertyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Use currentImages state which is already populated by file selection or manual input
        const finalImages = [...currentImages];

        if (finalImages.length === 0) {
             if(!confirm("¿Estás seguro de guardar sin imágenes?")) return;
        }

        // Check for size limit (approx 1MB for Firestore doc)
        const totalSize = JSON.stringify(finalImages).length;
        if (totalSize > 900000) { // 900KB safety limit
            showStatus('Error: Las imágenes son demasiadas o muy grandes para la base de datos gratuita. Intenta subir menos fotos.', 'error');
            return;
        }

        const propertyData = {
            title: document.getElementById('title').value,
            operation: document.getElementById('operation').value,
            currency: document.getElementById('currency').value,
            price: document.getElementById('price').value,
            location: document.getElementById('location').value,
            lat: document.getElementById('lat').value,
            lng: document.getElementById('lng').value,
            description: document.getElementById('description').value,
            images: finalImages,
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

    // Helper function to compress images
    function compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Compress to JPEG 0.6 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }

    function resetForm() {
        propertyForm.reset();
        editIdInput.value = '';
        document.getElementById('form-title').textContent = 'Agregar / Editar Propiedad';
        cancelEditBtn.style.display = 'none';
        document.getElementById('image-upload').value = ''; // Clear file input
        currentImages = [];
        renderImagePreviews();
        
        // Reset map
        if (map && marker) {
            const defaultLat = -33.4489;
            const defaultLng = -70.6693;
            map.setView([defaultLat, defaultLng], 13);
            marker.setLatLng([defaultLat, defaultLng]);
            updateLatLngInputs(defaultLat, defaultLng);
        }
    }
});