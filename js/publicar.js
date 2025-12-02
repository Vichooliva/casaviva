document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('publicar-form');
    const imageUpload = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const statusMessage = document.getElementById('status-message');
    const uploadStatus = document.getElementById('upload-status');

    let currentImages = [];

    // --- Image Handling ---
    imageUpload.addEventListener('change', async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;

        if (currentImages.length + files.length > 5) {
            alert('Solo puedes subir un máximo de 5 fotos.');
            return;
        }

        uploadStatus.textContent = 'Procesando...';

        try {
            for (let i = 0; i < files.length; i++) {
                const base64 = await compressImage(files[i]);
                currentImages.push(base64);
            }
            renderImagePreviews();
            uploadStatus.textContent = '';
        } catch (error) {
            console.error(error);
            uploadStatus.textContent = 'Error al procesar imagen.';
        }
        
        e.target.value = '';
    });

    window.renderImagePreviews = () => {
        imagePreviewContainer.innerHTML = '';
        currentImages.forEach((url, index) => {
            const div = document.createElement('div');
            div.style.cssText = 'position: relative; border: 1px solid #444; border-radius: 4px; overflow: hidden; aspect-ratio: 1;';
            
            const img = document.createElement('img');
            img.src = url;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '×';
            deleteBtn.type = 'button';
            deleteBtn.style.cssText = 'position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.7); border: none; color: white; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;';
            deleteBtn.onclick = () => removeImage(index);

            div.appendChild(img);
            div.appendChild(deleteBtn);
            imagePreviewContainer.appendChild(div);
        });
    };

    window.removeImage = (index) => {
        currentImages.splice(index, 1);
        renderImagePreviews();
    };

    // --- Form Submission ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        try {
            const propertyData = {
                title: document.getElementById('title').value,
                location: document.getElementById('location').value,
                price: document.getElementById('price').value,
                description: document.getElementById('description').value,
                contactName: document.getElementById('contact-name').value,
                contactPhone: document.getElementById('contact-phone').value,
                contactEmail: document.getElementById('contact-email').value,
                images: currentImages,
                status: 'pending', // Mark as pending for admin review
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Check size limit
            const totalSize = JSON.stringify(propertyData).length;
            if (totalSize > 900000) {
                throw new Error('Las imágenes son demasiado grandes. Intenta subir menos fotos.');
            }

            await db.collection("properties").add(propertyData);

            form.reset();
            currentImages = [];
            renderImagePreviews();
            
            showStatus('¡Solicitud enviada con éxito! Nos pondremos en contacto contigo pronto.', 'success');

        } catch (error) {
            console.error("Error adding document: ", error);
            showStatus('Error al enviar: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'ENVIAR SOLICITUD';
        }
    });

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
    }

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

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }
});
