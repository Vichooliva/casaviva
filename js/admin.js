document.addEventListener('DOMContentLoaded', () => {
    // Login Logic
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const adminContent = document.getElementById('admin-content');
    const loginError = document.getElementById('login-error');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        if (user === 'casaadmin1' && pass === 'Laclave1') {
            loginModal.style.display = 'none';
            adminContent.style.display = 'block';
        } else {
            loginError.style.display = 'block';
        }
    });

    // Admin Logic
    let properties = [];
    const form = document.getElementById('property-form');
    const outputContainer = document.getElementById('output-container');
    const jsonOutput = document.getElementById('json-output');
    const copyBtn = document.getElementById('copy-btn');
    const loadDataBtn = document.getElementById('load-data-btn');
    const propertiesList = document.getElementById('properties-list');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const editIdInput = document.getElementById('edit-id');

    // Load existing data
    loadDataBtn.addEventListener('click', () => {
        fetch('data/properties.json')
            .then(res => res.json())
            .then(data => {
                properties = data;
                renderPropertiesList();
                alert('Datos cargados correctamente. Ahora puedes editar o borrar.');
            })
            .catch(err => alert('Error al cargar datos: ' + err));
    });

    function renderPropertiesList() {
        propertiesList.innerHTML = '';
        if (properties.length === 0) {
            propertiesList.innerHTML = '<p style="text-align: center;">No hay propiedades en la lista.</p>';
            return;
        }

        properties.forEach(prop => {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #333; background: #1a1a1a; margin-bottom: 5px;';
            item.innerHTML = `
                <div>
                    <strong style="color: var(--primary-gold);">${prop.title}</strong>
                    <br><small>${prop.location} - ${prop.price}</small>
                </div>
                <div>
                    <button onclick="editProperty(${prop.id})" style="background: #003366; color: white; border: none; padding: 5px 10px; cursor: pointer; margin-right: 5px;">Editar</button>
                    <button onclick="deleteProperty(${prop.id})" style="background: #800000; color: white; border: none; padding: 5px 10px; cursor: pointer;">Borrar</button>
                </div>
            `;
            propertiesList.appendChild(item);
        });
        
        // Update JSON output automatically whenever list changes
        updateJsonOutput();
    }

    // Expose functions to global scope for onclick handlers
    window.editProperty = (id) => {
        const prop = properties.find(p => p.id === id);
        if (!prop) return;

        document.getElementById('title').value = prop.title;
        document.getElementById('price').value = prop.price;
        document.getElementById('location').value = prop.location;
        document.getElementById('description').value = prop.description;
        document.getElementById('status').value = prop.status;
        
        // Handle images (array to newline separated string)
        const images = prop.images || (prop.image ? [prop.image] : []);
        document.getElementById('images-input').value = images.join('\n');

        editIdInput.value = prop.id;
        document.getElementById('form-title').textContent = 'Editando Propiedad: ' + prop.title;
        cancelEditBtn.style.display = 'inline-block';
        
        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
    };

    window.deleteProperty = (id) => {
        if (confirm('¿Estás seguro de borrar esta propiedad?')) {
            properties = properties.filter(p => p.id !== id);
            renderPropertiesList();
        }
    };

    cancelEditBtn.addEventListener('click', () => {
        form.reset();
        editIdInput.value = '';
        document.getElementById('form-title').textContent = 'Agregar / Editar Propiedad';
        cancelEditBtn.style.display = 'none';
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = editIdInput.value ? parseInt(editIdInput.value) : Date.now();
        const imagesText = document.getElementById('images-input').value;
        // Split by newline and filter empty strings
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
            // Update existing
            const index = properties.findIndex(p => p.id === id);
            if (index !== -1) properties[index] = newProp;
        } else {
            // Add new
            properties.push(newProp);
        }

        // Reset form
        form.reset();
        editIdInput.value = '';
        document.getElementById('form-title').textContent = 'Agregar / Editar Propiedad';
        cancelEditBtn.style.display = 'none';

        renderPropertiesList();
        alert('Propiedad guardada en la lista temporal. No olvides copiar el JSON final.');
    });

    function updateJsonOutput() {
        const jsonString = JSON.stringify(properties, null, 2);
        jsonOutput.textContent = jsonString;
        outputContainer.style.display = 'block';
    }

    copyBtn.addEventListener('click', () => {
        const textToCopy = jsonOutput.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '¡Copiado!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Error al copiar:', err);
        });
    });
});