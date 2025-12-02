document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('properties-grid');
    const WHATSAPP_NUMBER = '56998468181';

    // Fetch properties from JSON file
    fetch('data/properties.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(properties => {
            renderProperties(properties);
        })
        .catch(error => {
            console.error('Error loading properties:', error);
            grid.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1/-1;">Hubo un error al cargar las propiedades. Por favor intenta más tarde.</p>';
        });

    function renderProperties(properties) {
        grid.innerHTML = ''; // Clear loading message

        if (properties.length === 0) {
            grid.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1/-1;">No hay propiedades disponibles en este momento.</p>';
            return;
        }

        properties.forEach(property => {
            const card = document.createElement('div');
            card.className = 'property-card';
            
            // Create WhatsApp link with pre-filled message
            const message = `Hola, estoy interesado en la propiedad: ${property.title} (${property.location})`;
            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

            // Check if sold
            const isSold = property.status === 'sold';
            const ribbonHtml = isSold ? '<div class="ribbon"></div>' : '';
            
            // If sold, maybe disable link or change text? User said "redirigir al whatssap", 
            // but usually sold properties are just for display. I'll keep the link but maybe change text.
            // User requirement: "todas las propiedades deben redirigir al whatssap"
            
            card.innerHTML = `
                ${ribbonHtml}
                <img src="${property.image}" alt="${property.title}" class="card-image">
                <div class="card-content">
                    <h3 class="card-title">${property.title}</h3>
                    <div class="card-location">
                        <i class="fas fa-map-marker-alt"></i> ${property.location}
                    </div>
                    <div class="card-price">${property.price}</div>
                    <p class="card-description">${property.description}</p>
                    <a href="${whatsappUrl}" target="_blank" class="contact-btn">
                        <i class="fab fa-whatsapp"></i> ${isSold ? 'Consultar Similar' : 'Me Interesa'}
                    </a>
                </div>
            `;

            grid.appendChild(card);
        });
    }
});