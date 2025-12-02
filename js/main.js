let allProperties = []; // Store all properties globally for filtering
let showFavoritesOnly = false;

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('properties-grid');
    const WHATSAPP_NUMBER = '56998468181';

    // Only run if we are on the index page with the grid
    if (grid) {
        // Setup Filter Listeners
        document.getElementById('filter-btn').addEventListener('click', applyFilters);
        document.getElementById('search-input').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') applyFilters();
        });
        
        // Favorites Toggle
        const favBtn = document.getElementById('toggle-favorites');
        favBtn.addEventListener('click', () => {
            showFavoritesOnly = !showFavoritesOnly;
            favBtn.style.background = showFavoritesOnly ? '#ff6b6b' : 'transparent';
            favBtn.style.color = showFavoritesOnly ? 'white' : '#ff6b6b';
            favBtn.innerHTML = showFavoritesOnly ? '<i class="fas fa-heart"></i> Ver Todos' : '<i class="fas fa-heart"></i> Ver Favoritos';
            applyFilters();
        });

        // Wait for Firebase to initialize
        const checkDb = setInterval(() => {
            if (typeof db !== 'undefined') {
                clearInterval(checkDb);
                loadPropertiesFromFirebase();
            }
        }, 100);
    }
});

function loadPropertiesFromFirebase() {
    const grid = document.getElementById('properties-grid');
    
    db.collection("properties").get().then((querySnapshot) => {
        allProperties = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Filter out pending properties
            if (data.status !== 'pending') {
                allProperties.push({ id: doc.id, ...data });
            }
        });
        // Initial render (sorted by newest by default if we had a date field, but here just as is)
        applyFilters(); 
    }).catch((error) => {
        console.error("Error getting documents: ", error);
        grid.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1/-1;">Hubo un error al cargar las propiedades.</p>';
    });
}

function applyFilters() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const minPrice = parseFloat(document.getElementById('min-price').value) || 0;
    const maxPrice = parseFloat(document.getElementById('max-price').value) || Infinity;
    const sort = document.getElementById('sort-select').value;

    let filtered = allProperties.filter(p => {
        // Text Search
        const matchText = p.title.toLowerCase().includes(search) || p.location.toLowerCase().includes(search);
        
        // Price Parsing (Handle "UF 10.000" or "$100.000")
        // This is a simple parser, assumes the first number found is the price value
        const priceString = p.price.replace(/\./g, '').replace(/,/g, '.'); // Remove thousands separator
        const priceValue = parseFloat(priceString.match(/[\d\.]+/)) || 0;
        
        // Note: This compares raw numbers. If mixing UF and CLP, this will be inaccurate without currency conversion.
        // For now, we assume the user filters based on the dominant currency number.
        const matchPrice = priceValue >= minPrice && priceValue <= maxPrice;

        // Favorites Filter
        let matchFav = true;
        if (showFavoritesOnly) {
            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            matchFav = favorites.includes(p.id);
        }

        return matchText && matchPrice && matchFav;
    });

    // Sorting
    if (sort === 'price-asc') {
        filtered.sort((a, b) => {
            const pA = parseFloat(a.price.replace(/\./g, '').replace(/,/g, '.').match(/[\d\.]+/)) || 0;
            const pB = parseFloat(b.price.replace(/\./g, '').replace(/,/g, '.').match(/[\d\.]+/)) || 0;
            return pA - pB;
        });
    } else if (sort === 'price-desc') {
        filtered.sort((a, b) => {
            const pA = parseFloat(a.price.replace(/\./g, '').replace(/,/g, '.').match(/[\d\.]+/)) || 0;
            const pB = parseFloat(b.price.replace(/\./g, '').replace(/,/g, '.').match(/[\d\.]+/)) || 0;
            return pB - pA;
        });
    } else if (sort === 'newest') {
        // Sort by createdAt if available
        filtered.sort((a, b) => {
            const dateA = a.createdAt ? a.createdAt.seconds : 0;
            const dateB = b.createdAt ? b.createdAt.seconds : 0;
            return dateB - dateA;
        });
    }

    renderProperties(filtered);
}

function renderProperties(properties) {
    const grid = document.getElementById('properties-grid');
    grid.innerHTML = '';

    if (properties.length === 0) {
        grid.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1/-1;">No hay propiedades disponibles.</p>';
        return;
    }

        const isSold = property.status === 'sold';
        const ribbonHtml = isSold ? '<div class="ribbon"></div>' : '';

        // Check if favorite
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const isFav = favorites.includes(property.id);

        // Click on card goes to detail page
        card.onclick = (e) => {
            // Prevent navigation if clicking the contact button or heart
            if (!e.target.closest('.contact-btn') && !e.target.closest('.fav-btn')) {
                window.location.href = `property.html?id=${property.id}`;
            }
        };

        card.innerHTML = `
            ${ribbonHtml}
            <button class="fav-btn" onclick="toggleFavorite('${property.id}', this)" style="position: absolute; top: 10px; right: 10px; z-index: 10; background: rgba(0,0,0,0.5); border: none; color: ${isFav ? '#ff6b6b' : 'white'}; font-size: 1.5rem; cursor: pointer; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.3s;">
                <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
            </button>
            <div class="card-image-container">
                <img src="${mainImage}" alt="${property.title}" class="card-image" onerror="this.src='https://via.placeholder.com/800x600?text=Imagen+No+Disponible'">
            </div>
            <div class="card-content">

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
    });
}

window.toggleFavorite = (id, btn) => {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(id);
    
    if (index === -1) {
        favorites.push(id);
        btn.style.color = '#ff6b6b';
        btn.querySelector('i').classList.remove('far');
        btn.querySelector('i').classList.add('fas');
    } else {
        favorites.splice(index, 1);
        btn.style.color = 'white';
        btn.querySelector('i').classList.remove('fas');
        btn.querySelector('i').classList.add('far');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // If we are in "Show Favorites" mode, refresh the grid
    if (showFavoritesOnly) {
        applyFilters();
    }
};

// Function to load property details (called from property.html)
        `;

        grid.appendChild(card);
    });
}

// Function to load property details (called from property.html)
function loadPropertyDetail(id) {
    const container = document.getElementById('property-detail-content');
    const WHATSAPP_NUMBER = '56998468181';

    // Wait for Firebase
    const checkDb = setInterval(() => {
        if (typeof db !== 'undefined') {
            clearInterval(checkDb);
            
            db.collection("properties").doc(id).get().then((doc) => {
                if (doc.exists) {
                    const property = { id: doc.id, ...doc.data() };
                    if (property.status === 'pending') {
                        container.innerHTML = '<div style="text-align: center; padding: 50px;"><h3>Propiedad en Revisión</h3><p>Esta propiedad está siendo revisada por nuestros administradores.</p><a href="index.html" class="contact-btn" style="display: inline-block; width: auto; margin-top: 20px;">Volver al Inicio</a></div>';
                        return;
                    }
                    renderDetail(property, container, WHATSAPP_NUMBER);
                } else {
                    container.innerHTML = '<p>Propiedad no encontrada.</p>';
                }
            }).catch((error) => {
                console.error("Error getting document:", error);
                container.innerHTML = '<p>Error al cargar la propiedad.</p>';
            });
        }
    }, 100);
}

function renderDetail(property, container, whatsappNumber) {
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
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
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
                        
                        <!-- Map Container -->
                        <div id="map-container" style="margin-top: 30px; margin-bottom: 30px;">
                            <h3 style="color: var(--primary-gold); margin-bottom: 15px;">Ubicación</h3>
                            <div id="map" style="height: 300px; width: 100%; border-radius: 10px; z-index: 1;"></div>
                        </div>

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
            
            // Initialize Map
            if (typeof L !== 'undefined') {
                const lat = parseFloat(property.lat) || -33.4489; // Default Santiago
                const lng = parseFloat(property.lng) || -70.6693;
                
                const map = L.map('map').setView([lat, lng], 13);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);

                if (property.lat && property.lng) {
                    L.marker([lat, lng]).addTo(map)
                        .bindPopup(property.title)
                        .openPopup();
                } else {
                    // If no specific coords, show circle for general area (mock)
                    L.circle([lat, lng], {
                        color: '#D4AF37',
                        fillColor: '#D4AF37',
                        fillOpacity: 0.2,
                        radius: 800
                    }).addTo(map).bindPopup("Ubicación aproximada: " + property.location);
                }
            }
}

function changeMainImage(src, thumbnailElement) {
    document.getElementById('main-gallery-image').src = src;
    // Update active class
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumbnailElement.classList.add('active');
}