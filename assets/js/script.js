// script.js - Código simplificado para Pizzería Delis Pizza

document.addEventListener('DOMContentLoaded', function() {
    // Año actual
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Detectar si es PWA/APK
    if (window.matchMedia('(display-mode: standalone').matches || 
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')) {
        document.body.classList.add('app-mode');
    }

    // Registrar Service Worker
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('assets/js/sw.js').catch(function(error) {
                console.log('ServiceWorker registration failed:', error);
            });
        });
    }

    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // CARRUSEL
    const carousel = document.querySelector('.carousel');
    const track = document.querySelector('.carousel-track');
    const slides = document.querySelectorAll('.carousel-slide');
    const nextButton = document.querySelector('.carousel-btn.next');
    const prevButton = document.querySelector('.carousel-btn.prev');
    const indicators = document.querySelectorAll('.carousel-indicator');
    
    let currentIndex = 0;
    const totalSlides = slides.length;
    
    function updateCarousel() {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });
    }
    
    function goToSlide(index) {
        currentIndex = index;
        updateCarousel();
    }
    
    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalSlides;
        updateCarousel();
    }
    
    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        updateCarousel();
    }
    
    nextButton.addEventListener('click', nextSlide);
    prevButton.addEventListener('click', prevSlide);
    
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => goToSlide(index));
    });
    
    let autoSlide = setInterval(nextSlide, 5000);
    
    carousel.addEventListener('mouseenter', () => {
        clearInterval(autoSlide);
    });
    
    carousel.addEventListener('mouseleave', () => {
        autoSlide = setInterval(nextSlide, 5000);
    });
    
    updateCarousel();

    // WhatsApp Modal
    const whatsappBtn = document.getElementById('whatsappBtn');
    const pizzaModal = document.getElementById('pizzaModal');
    const closeModal = document.querySelector('.close-modal');
    const gpsStatus = document.getElementById('gpsStatus');
    const pizzaDescription = document.getElementById('pizzaDescription');
    const pizzaQuantity = document.getElementById('pizzaQuantity');
    const manualLocationInput = document.getElementById('manualLocationInput');
    const manualLocation = document.getElementById('manualLocation');
    const userMessage = document.getElementById('userMessage');
    const sendWhatsApp = document.getElementById('sendWhatsApp');
    const locationOptions = document.querySelectorAll('.location-option');
    
    const phoneNumber = '524427128200'; // Número de WhatsApp de la pizzería
    let userLocation = null;
    let locationType = 'gps'; // 'gps' o 'manual'
    let detectedLocation = '';
    let manualAddress = '';

    // Botones de ordenar en el menú principal
    document.querySelectorAll('.menu-item .btn, #specialPizzaBtn, #orderHeroBtn').forEach(button => {
        button.addEventListener('click', function() {
            const pizzaName = this.getAttribute('data-pizza');
            
            // Abrir modal
            pizzaModal.style.display = 'block';
            pizzaDescription.value = `1x ${pizzaName}`;
            pizzaQuantity.value = 1;
            getLocation();
            updateSendButton();
        });
    });

    // Abrir modal al hacer click en WhatsApp
    whatsappBtn.addEventListener('click', function() {
        pizzaModal.style.display = 'block';
        pizzaDescription.value = '';
        pizzaQuantity.value = 1;
        getLocation();
        updateSendButton();
    });

    // Cerrar modal
    closeModal.addEventListener('click', function() {
        pizzaModal.style.display = 'none';
        resetForm();
    });

    // Cerrar modal con tecla ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && pizzaModal.style.display === 'block') {
            pizzaModal.style.display = 'none';
            resetForm();
        }
    });

    // Cerrar modal al hacer click fuera
    window.addEventListener('click', function(event) {
        if (event.target === pizzaModal) {
            pizzaModal.style.display = 'none';
            resetForm();
        }
    });

    // Cambiar opción de ubicación
    locationOptions.forEach(option => {
        option.addEventListener('click', function() {
            const type = this.getAttribute('data-location-type');
            
            locationOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            locationType = type;
            
            if (type === 'manual') {
                manualLocationInput.classList.add('show');
                sendWhatsApp.disabled = false; // Habilitar botón si hay dirección manual
            } else {
                manualLocationInput.classList.remove('show');
                // Verificar si tenemos ubicación GPS
                updateSendButton();
            }
        });
    });

    // Obtener ubicación GPS
    function getLocation() {
        gpsStatus.textContent = 'Obteniendo ubicación...';
        gpsStatus.className = 'gps-status';
        
        if (locationType !== 'gps') return;
        
        if (!navigator.geolocation) {
            gpsStatus.textContent = '❌ Geolocalización no soportada por tu navegador. Por favor escribe tu dirección manualmente.';
            gpsStatus.classList.add('gps-error');
            locationType = 'manual';
            locationOptions.forEach(opt => {
                if (opt.getAttribute('data-location-type') === 'manual') {
                    opt.classList.add('selected');
                    opt.querySelector('input').checked = true;
                } else {
                    opt.classList.remove('selected');
                    opt.querySelector('input').checked = false;
                }
            });
            manualLocationInput.classList.add('show');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            // Success
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                userLocation = { lat, lng };
                
                getAddressFromCoordinates(lat, lng);
            },
            // Error
            function(error) {
                let errorMessage = '❌ No se pudo obtener la ubicación automática. Por favor escribe tu dirección manualmente.';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = '❌ Permiso de ubicación denegado. Por favor escribe tu dirección manualmente.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = '❌ Información de ubicación no disponible. Por favor escribe tu dirección manualmente.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = '❌ Tiempo de espera agotado. Por favor escribe tu dirección manualmente.';
                        break;
                }
                
                gpsStatus.textContent = errorMessage;
                gpsStatus.classList.add('gps-error');
                locationType = 'manual';
                locationOptions.forEach(opt => {
                    if (opt.getAttribute('data-location-type') === 'manual') {
                        opt.classList.add('selected');
                        opt.querySelector('input').checked = true;
                    } else {
                        opt.classList.remove('selected');
                        opt.querySelector('input').checked = false;
                    }
                });
                manualLocationInput.classList.add('show');
                updateSendButton();
            },
            // Options
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    // Obtener dirección a partir de coordenadas
    function getAddressFromCoordinates(lat, lng) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`)
            .then(response => response.json())
            .then(data => {
                let direccionFormateada = '';
                
                if (data && data.address) {
                    const addr = data.address;
                    
                    // Construir dirección amigable
                    let partes = [];
                    if (addr.road) partes.push(addr.road);
                    if (addr.house_number) partes.push(`#${addr.house_number}`);
                    if (addr.suburb) partes.push(addr.suburb);
                    if (addr.city) partes.push(addr.city);
                    if (addr.state) partes.push(addr.state);
                    
                    direccionFormateada = partes.join(', ');
                }
                
                if (!direccionFormateada && data && data.display_name) {
                    direccionFormateada = data.display_name.split(',').slice(0, 3).join(', ');
                }
                
                if (!direccionFormateada) {
                    direccionFormateada = `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                }
                
                detectedLocation = direccionFormateada;
                gpsStatus.textContent = `📍 Ubicación detectada: ${direccionFormateada}`;
                gpsStatus.classList.add('gps-success');
                updateSendButton();
            })
            .catch(error => {
                detectedLocation = `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                gpsStatus.textContent = `📍 Ubicación: ${detectedLocation}`;
                gpsStatus.classList.add('gps-success');
                updateSendButton();
            });
    }

    // Actualizar estado del botón de enviar
    function updateSendButton() {
        const hasDescription = pizzaDescription.value.trim().length > 0;
        const hasLocation = (locationType === 'gps' && detectedLocation) || 
                           (locationType === 'manual' && manualLocation.value.trim().length > 0);
        
        sendWhatsApp.disabled = !hasDescription || !hasLocation;
    }

    // Enviar mensaje por WhatsApp
    sendWhatsApp.addEventListener('click', function() {
        if (sendWhatsApp.disabled) return;
        
        const description = pizzaDescription.value.trim();
        const quantity = pizzaQuantity.value;
        const instructions = userMessage.value.trim();
        const locationInfo = locationType === 'gps' ? detectedLocation : manualLocation.value.trim();
        
        // Construir mensaje para WhatsApp
        let message = `* Delis Pizza - Pedido de Pizza*\n\n`;
        message += `* MI PEDIDO:*\n`;
        message += `────────────────────\n`;
        message += `${description}\n`;
        message += `Cantidad total: ${quantity} pizza(s)\n`;
        message += `────────────────────\n\n`;
        
        message += `* MI UBICACIÓN PARA ENTREGA:*\n`;
        message += `${locationInfo}\n\n`;
        
        if (userLocation && locationType === 'gps') {
            const mapsUrl = `https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}`;
            message += `*Enlace de Google Maps:* ${mapsUrl}\n\n`;
        }
        
        if (instructions) {
            message += `*📝 INSTRUCCIONES ESPECIALES:*\n`;
            message += `${instructions}\n\n`;
        }
        
        message += `* MIS DATOS DE CONTACTO:*\n`;
        message += `(Favor de contactarme para confirmar pedido y forma de pago)`;
        
        // Codificar el mensaje para URL
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        // Abrir WhatsApp
        window.open(whatsappUrl, '_blank');
        
        // Cerrar modal
        pizzaModal.style.display = 'none';
        
        // Resetear formulario
        resetForm();
    });

    // Event listeners para actualizar botón
    pizzaDescription.addEventListener('input', updateSendButton);
    pizzaQuantity.addEventListener('input', updateSendButton);
    manualLocation.addEventListener('input', updateSendButton);
    userMessage.addEventListener('input', updateSendButton);

    // Resetear formulario
    function resetForm() {
        pizzaDescription.value = '';
        pizzaQuantity.value = 1;
        manualLocation.value = '';
        userMessage.value = '';
        detectedLocation = '';
        userLocation = null;
        gpsStatus.textContent = '';
        gpsStatus.className = 'gps-status';
        locationType = 'gps';
        
        locationOptions.forEach(opt => {
            if (opt.getAttribute('data-location-type') === 'gps') {
                opt.classList.add('selected');
                opt.querySelector('input').checked = true;
            } else {
                opt.classList.remove('selected');
                opt.querySelector('input').checked = false;
            }
        });
        
        manualLocationInput.classList.remove('show');
        sendWhatsApp.disabled = true;
    }

    // Inicializar
    updateSendButton();
});