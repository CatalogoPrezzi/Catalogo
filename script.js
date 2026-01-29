// Dati dei prodotti
let products = [];

// Carica i prodotti dal JSON
async function loadProductsData() {
    try {
        const response = await fetch('products.json');
        products = await response.json();
        loadProducts();
    } catch (error) {
        console.error('Errore nel caricamento dei prodotti:', error);
    }
}

let currentFilter = 'all';

// Inizializza l'app
function loadProducts() {
    renderProducts(products);
    createFilters();
}

// Crea i bottoni filtro
function createFilters() {
    const categories = ['all', ...new Set(products.map(p => p.category))];
    // Aggiungi tag speciali
    const allTags = new Set();
    products.forEach(p => {
        if (p.tags) {
            p.tags.forEach(tag => allTags.add(tag));
        }
    });
    allTags.forEach(tag => categories.push(tag));
    
    const filtersContainer = document.getElementById('filtersContainer');
    
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${category === 'all' ? 'active' : ''}`;
        btn.textContent = category === 'all' ? 'Tutti' : category;
        btn.onclick = () => filterProducts(category, btn);
        filtersContainer.appendChild(btn);
    });
}

// Filtra i prodotti
function filterProducts(category, btn) {
    currentFilter = category;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    let filtered;
    if (category === 'all') {
        filtered = products;
    } else {
        // Cerca sia nella category che nei tags
        filtered = products.filter(p => 
            p.category === category || (p.tags && p.tags.includes(category))
        );
    }
    renderProducts(filtered);
}

// Renderizza i prodotti
function renderProducts(productsToShow) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';

    if (productsToShow.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Nessun prodotto trovato</p>';
        return;
    }

    productsToShow.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Inizializza lo slider
        if (!product.currentImageIndex) {
            product.currentImageIndex = 0;
        }
        
        // Inizializza la misura selezionata
        if (!product.selectedSize) {
            product.selectedSize = 0;
        }
        
        const selectedPrice = product.sizes[product.selectedSize].price;
        const priceDisplay = selectedPrice !== null ? `${selectedPrice}€` : 'Contatta per info';
        
        // Crea i dot colore
        let colorsDots = '';
        if (product.colors.length > 0) {
            const colorMap = {
                'Rosso': '#e74c3c',
                'Bianco': '#ecf0f1',
                'Nero': '#2c3e50',
                'Blu': '#3498db',
                'Giallo': '#f1c40f',
                'Verde': '#2ecc71',
                'Grigio': '#95a5a6',
                'Rosa': '#e91e63',
                'Azzurro': '#1abc9c',
                'Arancione': '#e67e22',
                'Marrone': '#8B4513'
            };

            product.colors.forEach(color => {
                const baseColor = color.split('-')[0];
                colorsDots += `<div class="color-dot" style="background-color: ${colorMap[baseColor] || '#ccc'};" title="${color}"></div>`;
            });
        }

        // Crea lo slider HTML
        let sliderHTML = `<div class="image-slider" data-product-id="${product.id}">`;
        product.images.forEach((img, idx) => {
            const isActive = idx === product.currentImageIndex;
            sliderHTML += `<div class="image-loading ${isActive ? 'active' : ''}"></div><img src="${img}" alt="${product.name}" class="slider-image ${isActive ? 'active' : ''}" data-lazy="${img}" loading="lazy">`;
        });
        
        // Aggiungi controlli se ci sono più immagini
        if (product.images.length > 1) {
            sliderHTML += `<button class="slider-btn prev" data-product-id="${product.id}">‹</button>`;
            sliderHTML += `<button class="slider-btn next" data-product-id="${product.id}">›</button>`;
            sliderHTML += `<div class="slider-controls">`;
            product.images.forEach((_, idx) => {
                sliderHTML += `<div class="slider-dot ${idx === product.currentImageIndex ? 'active' : ''}" data-image-idx="${idx}" data-product-id="${product.id}"></div>`;
            });
            sliderHTML += `</div>`;
        }
        sliderHTML += `</div>`;

        card.innerHTML = `
            <div class="product-image">
                ${sliderHTML}
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-category">${product.category}</div>
                
                <div class="product-variants">
                    ${product.sizes.length > 0 ? `
                        <div class="variant-label">Misure disponibili:</div>
                        <div class="variant-pills" data-product-id="${product.id}">
                            ${product.sizes.map((s, idx) => `<span class="variant-pill ${idx === product.selectedSize ? 'selected' : ''}" data-size-idx="${idx}" data-product-id="${product.id}">${s.size}</span>`).join('')}
                        </div>
                    ` : ''}
                    
                    ${product.colors.length > 0 ? `
                        <div class="variant-label">Colori:</div>
                        <div class="colors-display">
                            ${colorsDots}
                        </div>
                    ` : ''}
                </div>

                <div class="price-section">
                    <div class="price-display" data-product-id="${product.id}">${priceDisplay}</div>
                    ${product.sizes.length > 1 ? '<div class="price-note">Scegli una misura</div>' : ''}
                </div>
            </div>
        `;
        
        grid.appendChild(card);
        
        // Aggiungi event listener ai bottoni misura
        card.querySelectorAll('.variant-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                const sizeIdx = parseInt(e.target.dataset.sizeIdx);
                const productId = parseInt(e.target.dataset.productId);
                const prod = products.find(p => p.id === productId);
                
                prod.selectedSize = sizeIdx;
                
                // Aggiorna visualizzazione pillole
                card.querySelectorAll('.variant-pill').forEach(p => p.classList.remove('selected'));
                e.target.classList.add('selected');
                
                // Aggiorna prezzo
                const newPrice = prod.sizes[sizeIdx].price;
                const priceText = newPrice !== null ? `${newPrice}€` : 'Contatta per info';
                card.querySelector(`.price-display[data-product-id="${productId}"]`).textContent = priceText;
            });
        });
        
        // Aggiungi event listener allo slider
        const updateSlider = (prodId, newIdx) => {
            const prod = products.find(p => p.id === prodId);
            prod.currentImageIndex = (newIdx + prod.images.length) % prod.images.length;
            
            // Aggiorna immagini
            card.querySelectorAll('.slider-image').forEach((img, idx) => {
                img.classList.toggle('active', idx === prod.currentImageIndex);
            });
            
            // Aggiorna dot
            card.querySelectorAll('.slider-dot').forEach((dot, idx) => {
                dot.classList.toggle('active', idx === prod.currentImageIndex);
            });
        };
        
        // Click sui dot
        card.querySelectorAll('.slider-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const prodId = parseInt(e.target.dataset.productId);
                const imgIdx = parseInt(e.target.dataset.imageIdx);
                updateSlider(prodId, imgIdx);
            });
        });
        
        // Click sui bottoni
        card.querySelectorAll('.slider-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prodId = parseInt(e.target.dataset.productId);
                const prod = products.find(p => p.id === prodId);
                const direction = e.target.classList.contains('prev') ? -1 : 1;
                updateSlider(prodId, prod.currentImageIndex + direction);
            });
        });

        // Gestione swipe per lo slider dei prodotti
        const slider = card.querySelector('.image-slider');
        let sliderTouchStart = 0;
        let sliderTouchEnd = 0;

        slider.addEventListener('touchstart', (e) => {
            sliderTouchStart = e.changedTouches[0].screenX;
        });

        slider.addEventListener('touchend', (e) => {
            sliderTouchEnd = e.changedTouches[0].screenX;
            const diff = sliderTouchStart - sliderTouchEnd;
            const minSwipeDistance = 30;

            if (Math.abs(diff) > minSwipeDistance) {
                const prodId = product.id;
                const prod = products.find(p => p.id === prodId);
                const direction = diff > 0 ? 1 : -1; // swipe left = next, swipe right = prev
                updateSlider(prodId, prod.currentImageIndex + direction);
            }
        });
        
        // Click sulle immagini per fullscreen
        card.querySelectorAll('.slider-image').forEach(img => {
            img.style.cursor = 'pointer';
            
            // Gestione errori caricamento immagini
            img.addEventListener('error', () => {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'image-error';
                errorDiv.textContent = 'Immagine non disponibile';
                img.style.display = 'none';
                img.parentElement.appendChild(errorDiv);
            });

            // Gestione caricamento immagini
            img.addEventListener('load', () => {
                const loadingDiv = img.previousElementSibling;
                if (loadingDiv && loadingDiv.classList.contains('image-loading')) {
                    loadingDiv.style.display = 'none';
                }
            });

            // Lazy loading - carica l'immagine quando visibile
            if (img.dataset.lazy) {
                if ('IntersectionObserver' in window) {
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting || entry.target.classList.contains('active')) {
                                entry.target.src = entry.target.dataset.lazy;
                                observer.unobserve(entry.target);
                            }
                        });
                    }, { rootMargin: '50px' });
                    observer.observe(img);
                } else {
                    // Fallback per browser vecchi
                    img.src = img.dataset.lazy;
                }
            }
            
            img.addEventListener('click', (e) => {
                const sliderImages = card.querySelectorAll('.slider-image');
                let currentIdx = 0;
                sliderImages.forEach((slider, idx) => {
                    if (slider.classList.contains('active')) {
                        currentIdx = idx;
                    }
                });
                openFullscreen(product.id, currentIdx);
            });
        });
    });
}

// Fullscreen Modal Functions
let currentFullscreenProduct = null;
let touchStartX = 0;
let touchEndX = 0;

function openFullscreen(prodId, imageIdx) {
    currentFullscreenProduct = {
        id: prodId,
        currentIdx: imageIdx
    };
    const product = products.find(p => p.id === prodId);
    updateFullscreenImage(product);
    const modal = document.getElementById('fullscreenModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus management - sposta il focus ai controlli della modale
    setTimeout(() => {
        document.querySelector('.fullscreen-close').focus();
    }, 100);
    
    // Preload prossima immagine
    preloadNextImage(product);
}

function closeFullscreen() {
    document.getElementById('fullscreenModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    currentFullscreenProduct = null;
}

function updateFullscreenImage(product) {
    const img = document.getElementById('fullscreenImage');
    const currentIdx = currentFullscreenProduct.currentIdx;
    img.src = product.images[currentIdx];
    document.getElementById('currentImageNum').textContent = currentIdx + 1;
    document.getElementById('totalImageNum').textContent = product.images.length;
    
    // Preload prossima immagine
    preloadNextImage(product);
}

function preloadNextImage(product) {
    const nextIdx = (currentFullscreenProduct.currentIdx + 1) % product.images.length;
    const nextImg = new Image();
    nextImg.src = product.images[nextIdx];
}

function fullscreenPrev() {
    if (!currentFullscreenProduct) return;
    const product = products.find(p => p.id === currentFullscreenProduct.id);
    currentFullscreenProduct.currentIdx = (currentFullscreenProduct.currentIdx - 1 + product.images.length) % product.images.length;
    updateFullscreenImage(product);
}

function fullscreenNext() {
    if (!currentFullscreenProduct) return;
    const product = products.find(p => p.id === currentFullscreenProduct.id);
    currentFullscreenProduct.currentIdx = (currentFullscreenProduct.currentIdx + 1) % product.images.length;
    updateFullscreenImage(product);
}

// Gestione swipe su mobile per fullscreen
const fullscreenModal = document.getElementById('fullscreenModal');
fullscreenModal.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

fullscreenModal.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    const diff = touchStartX - touchEndX;
    const minSwipeDistance = 50;
    
    if (Math.abs(diff) > minSwipeDistance) {
        if (diff > 0) {
            // Swipe left - prossima immagine
            fullscreenNext();
        } else {
            // Swipe right - immagine precedente
            fullscreenPrev();
        }
    }
}

// Chiudi con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeFullscreen();
    }
    if (e.key === 'ArrowLeft' && document.getElementById('fullscreenModal').classList.contains('active')) {
        fullscreenPrev();
    }
    if (e.key === 'ArrowRight' && document.getElementById('fullscreenModal').classList.contains('active')) {
        fullscreenNext();
    }
});

// Chiudi cliccando fuori dall'immagine
document.getElementById('fullscreenModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('fullscreenModal')) {
        closeFullscreen();
    }
});

// Trap focus nella modale quando aperta (accessibilità)
const modal = document.getElementById('fullscreenModal');
const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    const focusableContent = modal.querySelectorAll(focusableElements);
    const firstElement = focusableContent[0];
    const lastElement = focusableContent[focusableContent.length - 1];

    if (e.shiftKey) {
        if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
        }
    } else {
        if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
        }
    }
});

// Carica tutto al load
window.addEventListener('DOMContentLoaded', loadProductsData);
