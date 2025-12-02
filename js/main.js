document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('properties-grid');
    const WHATSAPP_NUMBER = '56998468181';

    // Only run if we are on the index page with the grid
    if (grid) {
        fetch('data/properties.json')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(properties => {
                renderProperties(properties);
            })
            .catch(error => {
                console.error('Error loading properties:', error);
                grid.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1/-1;">Hubo un error al cargar las propiedades.</p>';
            });
    }
});

function renderProperties(properties) {
    const grid = document.getElementById('properties-grid');
    grid.innerHTML = '';

    if (properties.length === 0) {
        grid.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1/-1;">No hay propiedades disponibles.</p>';
        return;
    }

    properties.forEach(property => {
        const card = document.createElement('div');
        card.className = 'property-card';
        
        // Use first image or placeholder
        const mainImage = (property.images && property.images.length > 0) ? property.images[0] : 'https://via.placeholder.com/800x600?text=Imagen+No+Disponible';
        
        const isSold = property.status === 'sold';
        const ribbonHtml = isSold ? '<div class="ribbon"></div>' : '';

        // Click on card goes to detail page
        card.onclick = (e) => {
            // Prevent navigation if clicking the contact button directly
            if (!e.target.closest('.contact-btn')) {
                window.location.href = `property.html?id=${property.id}`;
            }
        };

        card.innerHTML = `
            ${ribbonHtml}
            <div class="card-image-container">
                <img src="${mainImage}" alt="${property.title}" class="card-image" onerror="this.src='https://via.placeholder.com/800x600?text=Imagen+No+Disponible'">
            </div>
            <div class="card-content">
                <h3 class="card-title">${property.title}</h3>
                <div class="card-location">
                    <i class="fas fa-map-marker-alt"></i> ${property.location}
                </div>
                <div class="card-price">${property.price}</div>
                <p class="card-description">${property.description}</p>
                <a href="property.html?id=${property.id}" class="contact-btn">
                    Ver Detalles
                </a>
            </div>
        `;

        grid.appendChild(card);
    });
}

// Function to load property details (called from property.html)
function loadPropertyDetail(id) {
    const container = document.getElementById('property-detail-content');
    const WHATSAPP_NUMBER = '56998468181';

    fetch('data/properties.json')
        .then(res => res.json())
        .then(properties => {
            // Find property by ID (convert to string for comparison just in case)
            const property = properties.find(p => p.id == id);

            if (!property) {
                container.innerHTML = '<p>Propiedad no encontrada.</p>';
                return;
            }

            const mainImage = (property.images && property.images.length > 0) ? property.images[0] : 'https://via.placeholder.com/800x600?text=Imagen+No+Disponible';
            
            // Generate thumbnails HTML
            let thumbnailsHtml = '';
            if (property.images && property.images.length > 1) {
                thumbnailsHtml = '<div class="gallery-thumbnails">';
                property.images.forEach((img, index) => {
                    thumbnailsHtml += `<img src="${img}" class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage(this.src, this)">`;
                });
                thumbnailsHtml += '</div>';
            }

            const message = `Hola, estoy interesado en la propiedad: ${property.title} (${property.location})`;
            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
            const isSold = property.status === 'sold';

            container.innerHTML = `
                <div class="property-detail-container">
                    <div class="detail-gallery">
                        <img id="main-gallery-image" src="${mainImage}" class="gallery-main" onerror="this.src='https://via.placeholder.com/800x600?text=Imagen+No+Disponible'">
                        ${thumbnailsHtml}
                    </div>
                    <div class="detail-info">
                        <h2>${property.title}</h2>
                        <div class="card-location" style="font-size: 1.1rem; margin-bottom: 20px;">
                            <i class="fas fa-map-marker-alt"></i> ${property.location}
                        </div>
                        ${isSold ? '<div style="background: #800000; color: white; padding: 10px; display: inline-block; margin-bottom: 20px; font-weight: bold;">VENDIDA</div>' : ''}
                        <div class="detail-price">${property.price}</div>
                        <p class="detail-description">${property.description}</p>
                        
                        <a href="${whatsappUrl}" target="_blank" class="contact-btn" style="background-color: var(--primary-gold); color: black; border: none;">
                            <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
                        </a>
                        <br>
                        <a href="index.html" style="color: var(--text-muted); text-decoration: none; display: inline-block; margin-top: 20px;">
                            <i class="fas fa-arrow-left"></i> Volver al listado
                        </a>
                    </div>
                </div>
            `;
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = '<p>Error al cargar el detalle.</p>';
        });
}

function changeMainImage(src, thumbnailElement) {
    document.getElementById('main-gallery-image').src = src;
    // Update active class
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumbnailElement.classList.add('active');
}