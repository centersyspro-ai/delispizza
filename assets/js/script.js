// script.js - Código JavaScript para Pizzería Don Guiseppe (Múltiples Pizzas)

// Año actual automático
document.addEventListener('DOMContentLoaded', function() {
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
    
    // Auto slide cada 5 segundos
    let autoSlide = setInterval(nextSlide, 5000);
    
    carousel.addEventListener('mouseenter', () => {
        clearInterval(autoSlide);
    });
    
    carousel.addEventListener('mouseleave', () => {
        autoSlide = setInterval(nextSlide, 5000);
    });
    
    updateCarousel();

    // WhatsApp con GPS para pedidos de pizza (MÚLTIPLES PIZZAS)
    const whatsappBtn = document.getElementById('whatsappBtn');
    const pizzaModal = document.getElementById('pizzaModal');
    const closeModal = document.querySelector('.close-modal');
    const getLocationBtn = document.getElementById('getLocationBtn');
    const locationText = document.getElementById('locationText');
    const locationStatus = document.getElementById('locationStatus');
    const userMessage = document.getElementById('userMessage');
    const sendWhatsApp = document.getElementById('sendWhatsApp');
    const pizzaOptionsContainer = document.querySelector('.pizza-options');
    const orderSummary = document.getElementById('orderSummary');
    const selectedPizzasList = document.getElementById('selectedPizzasList');
    const totalPriceElement = document.getElementById('totalPrice');
    const itemCountElement = document.getElementById('itemCount');
    
    let userLocation = null;
    let selectedPizzas = []; // Array para almacenar pizzas seleccionadas
    const phoneNumber = '524427128200'; // Número de WhatsApp de la pizzería
    
    // Menú de pizzas
    const pizzaMenu = [
        { id: 1, name: 'Margherita Tradicional', price: 199, desc: 'Salsa de tomate, mozzarella fresca, albahaca' },
        { id: 2, name: 'Pepperoni Especial', price: 229, desc: 'Doble pepperoni, salsa especial, queso mozzarella' },
        { id: 3, name: 'Hawaiana Artesanal', price: 219, desc: 'Jamón de pavo, piña asada, queso mozzarella' },
        { id: 4, name: 'Mexicana Picante', price: 239, desc: 'Chorizo, jalapeños, pimiento, cebolla' },
        { id: 5, name: 'Vegetariana Fresca', price: 219, desc: 'Champiñones, pimientos, cebolla, aceitunas' },
        { id: 6, name: 'Cuatro Quesos', price: 249, desc: 'Mozzarella, gorgonzola, parmesano, queso de cabra' },
        { id: 7, name: 'Pizza Don Guiseppe', price: 299, desc: 'Especialidad de la casa con ingredientes premium' }
    ];
    
    // Generar opciones de pizza en el modal con controles de cantidad
    pizzaMenu.forEach(pizza => {
        const option = document.createElement('div');
        option.className = 'pizza-option';
        option.setAttribute('data-pizza-id', pizza.id);
        option.innerHTML = `
            <div class="pizza-name">${pizza.name}</div>
            <div class="pizza-price">$${pizza.price}</div>
            <div class="pizza-quantity" style="display: none;">
                <button class="quantity-btn minus">-</button>
                <span class="quantity-value">1</span>
                <button class="quantity-btn plus">+</button>
            </div>
            <div class="pizza-desc">${pizza.desc}</div>
        `;
        
        // Evento para seleccionar/deseleccionar pizza
        option.addEventListener('click', (e) => {
            // Si se hizo clic en los botones de cantidad, no hacer nada aquí
            if (e.target.classList.contains('quantity-btn')) {
                return;
            }
            
            const pizzaId = pizza.id;
            const existingIndex = selectedPizzas.findIndex(p => p.id === pizzaId);
            
            if (existingIndex === -1) {
                // Agregar pizza seleccionada
                selectedPizzas.push({
                    id: pizza.id,
                    name: pizza.name,
                    price: pizza.price,
                    quantity: 1
                });
                option.classList.add('selected');
                option.querySelector('.pizza-quantity').style.display = 'flex';
            } else {
                // Remover pizza seleccionada
                selectedPizzas.splice(existingIndex, 1);
                option.classList.remove('selected');
                option.querySelector('.pizza-quantity').style.display = 'none';
                option.querySelector('.quantity-value').textContent = '1';
            }
            
            updateOrderSummary();
            updateSendButton();
        });
        
        // Eventos para botones de cantidad
        const minusBtn = option.querySelector('.minus');
        const plusBtn = option.querySelector('.plus');
        const quantityValue = option.querySelector('.quantity-value');
        
        minusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const pizzaId = pizza.id;
            const pizzaIndex = selectedPizzas.findIndex(p => p.id === pizzaId);
            
            if (pizzaIndex !== -1 && selectedPizzas[pizzaIndex].quantity > 1) {
                selectedPizzas[pizzaIndex].quantity--;
                quantityValue.textContent = selectedPizzas[pizzaIndex].quantity;
                updateOrderSummary();
            } else if (selectedPizzas[pizzaIndex].quantity === 1) {
                // Si la cantidad es 1 y se presiona menos, remover la pizza
                selectedPizzas.splice(pizzaIndex, 1);
                option.classList.remove('selected');
                option.querySelector('.pizza-quantity').style.display = 'none';
                quantityValue.textContent = '1';
                updateOrderSummary();
                updateSendButton();
            }
        });
        
        plusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const pizzaId = pizza.id;
            const pizzaIndex = selectedPizzas.findIndex(p => p.id === pizzaId);
            
            if (pizzaIndex !== -1) {
                selectedPizzas[pizzaIndex].quantity++;
                quantityValue.textContent = selectedPizzas[pizzaIndex].quantity;
                updateOrderSummary();
            }
        });
        
        pizzaOptionsContainer.appendChild(option);
    });
    
    // Actualizar resumen del pedido
    function updateOrderSummary() {
        if (selectedPizzas.length === 0) {
            orderSummary.style.display = 'none';
            itemCountElement.textContent = '0';
            return;
        }
        
        let totalItems = 0;
        let totalPrice = 0;
        let summaryHTML = '';
        
        selectedPizzas.forEach(pizza => {
            const subtotal = pizza.price * pizza.quantity;
            totalItems += pizza.quantity;
            totalPrice += subtotal;
            
            summaryHTML += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed #ddd;">
                    <div>
                        <strong>${pizza.name}</strong><br>
                        <small>Cantidad: ${pizza.quantity} x $${pizza.price}</small>
                    </div>
                    <div style="font-weight: bold; color: var(--secondary-color);">
                        $${subtotal}
                    </div>
                </div>
            `;
        });
        
        selectedPizzasList.innerHTML = summaryHTML;
        totalPriceElement.innerHTML = `Total: <span style="color: var(--primary-color);">$${totalPrice} MXN</span>`;
        itemCountElement.textContent = totalItems;
        orderSummary.style.display = 'block';
    }
    
    // Botones de ordenar en el menú principal (añade 1 unidad de esa pizza)
    document.querySelectorAll('.menu-item .btn, #specialPizzaBtn, #orderHeroBtn').forEach(button => {
        button.addEventListener('click', function() {
            const pizzaName = this.getAttribute('data-pizza');
            const pizzaPrice = parseInt(this.getAttribute('data-price'));
            
            // Abrir modal
            pizzaModal.style.display = 'block';
            getLocation();
            
            // Buscar la pizza en el menú
            const pizza = pizzaMenu.find(p => p.name === pizzaName);
            if (pizza) {
                const pizzaOption = document.querySelector(`[data-pizza-id="${pizza.id}"]`);
                if (pizzaOption) {
                    // Verificar si ya está seleccionada
                    const existingIndex = selectedPizzas.findIndex(p => p.id === pizza.id);
                    
                    if (existingIndex === -1) {
                        // Agregar nueva pizza
                        selectedPizzas.push({
                            id: pizza.id,
                            name: pizza.name,
                            price: pizza.price,
                            quantity: 1
                        });
                        pizzaOption.classList.add('selected');
                        pizzaOption.querySelector('.pizza-quantity').style.display = 'flex';
                    } else {
                        // Incrementar cantidad si ya está seleccionada
                        selectedPizzas[existingIndex].quantity++;
                        pizzaOption.querySelector('.quantity-value').textContent = selectedPizzas[existingIndex].quantity;
                    }
                    
                    updateOrderSummary();
                    updateSendButton();
                    
                    // Hacer scroll a la pizza seleccionada
                    pizzaOption.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    });
    
    // Abrir modal al hacer click en WhatsApp
    whatsappBtn.addEventListener('click', function() {
        pizzaModal.style.display = 'block';
        getLocation();
    });
    
    // Cerrar modal
    closeModal.addEventListener('click', function() {
        pizzaModal.style.display = 'none';
    });
    
    // Cerrar modal con tecla ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && pizzaModal.style.display === 'block') {
            pizzaModal.style.display = 'none';
        }
    });
    
    // Cerrar modal al hacer click fuera
    window.addEventListener('click', function(event) {
        if (event.target === pizzaModal) {
            pizzaModal.style.display = 'none';
        }
    });
    
    // Obtener ubicación
    function getLocation() {
        locationText.textContent = 'Obteniendo ubicación...';
        locationStatus.classList.remove('location-success', 'location-error');
        sendWhatsApp.disabled = true;
        
        if (!navigator.geolocation) {
            locationText.textContent = '❌ Geolocalización no soportada por tu navegador';
            locationStatus.classList.add('location-error');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            // Success
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                userLocation = { lat, lng };
                
                // Obtener dirección en formato coloquial mexicano
                getAddressFromCoordinates(lat, lng);
            },
            // Error
            function(error) {
                let errorMessage = '❌ No se pudo obtener la ubicación';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = '❌ Permiso de ubicación denegado. Por favor habilita la ubicación en tu navegador.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = '❌ Información de ubicación no disponible.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = '❌ Tiempo de espera agotado para obtener la ubicación.';
                        break;
                }
                
                locationText.textContent = errorMessage;
                locationStatus.classList.add('location-error');
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
    
    // Obtener dirección a partir de coordenadas - FORMATO COLOQUIAL MEXICANO
    function getAddressFromCoordinates(lat, lng) {
        // Usar Nominatim (OpenStreetMap) para reverse geocoding gratuito
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`)
            .then(response => response.json())
            .then(data => {
                let direccionFormateada = '';
                
                if (data && data.address) {
                    const addr = data.address;
                    
                    // FORMATO COLOQUIAL MEXICANO: "calle [nombre] no. [número] [ciudad] [estado]"
                    
                    // 1. Calle/avenida
                    let calle = '';
                    if (addr.road) {
                        calle = addr.road;
                        if (!/^(calle|avenida|av\.|av |blvd|boulevard|cerrada|cerr\.|privada|priv\.)/i.test(calle)) {
                            calle = 'Calle ' + calle;
                        }
                    } else if (addr.pedestrian) {
                        calle = 'Andador ' + addr.pedestrian;
                    }
                    
                    // 2. Número exterior
                    if (addr.house_number) {
                        calle += ` no. ${addr.house_number}`;
                    }
                    
                    // 3. Colonia
                    let colonia = addr.suburb || addr.neighbourhood || '';
                    if (colonia) {
                        if (calle) calle += `, ${colonia}`;
                        else calle = colonia;
                    }
                    
                    // 4. Ciudad/Municipio
                    let ciudad = addr.city || addr.town || addr.village || addr.municipality || '';
                    
                    // 5. Estado
                    let estado = addr.state || '';
                    
                    // 6. Código postal
                    let cp = addr.postcode || '';
                    
                    // Construir dirección final
                    if (calle) {
                        direccionFormateada = calle;
                        if (ciudad && !direccionFormateada.includes(ciudad)) {
                            direccionFormateada += `, ${ciudad}`;
                        }
                        if (estado && !direccionFormateada.includes(estado)) {
                            direccionFormateada += `, ${estado}`;
                        }
                        if (cp) {
                            direccionFormateada += `, C.P. ${cp}`;
                        }
                    }
                }
                
                // Si no se pudo construir formato coloquial, usar display_name
                if (!direccionFormateada || direccionFormateada.trim().length < 10) {
                    if (data && data.display_name) {
                        // Limpiar y formatear display_name
                        direccionFormateada = data.display_name
                            .split(',')
                            .slice(0, 3)
                            .join(', ')
                            .replace(/,\s*,/g, ',')
                            .trim();
                    } else {
                        direccionFormateada = `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    }
                }
                
                locationText.textContent = `📍 ${direccionFormateada}`;
                locationStatus.classList.add('location-success');
                updateSendButton();
            })
            .catch(error => {
                // Si falla el reverse geocoding, mostrar coordenadas
                console.log('Error geocoding:', error);
                locationText.textContent = `📍 Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                locationStatus.classList.add('location-success');
                updateSendButton();
            });
    }
    
    // Botón para actualizar ubicación
    getLocationBtn.addEventListener('click', getLocation);
    
    // Actualizar estado del botón de enviar
    function updateSendButton() {
    sendWhatsApp.disabled = !userLocation;
}
    
    // Enviar mensaje por WhatsApp con múltiples pizzas
    sendWhatsApp.addEventListener('click', function() {
        if (!userLocation) return;
        
        const lat = userLocation.lat;
        const lng = userLocation.lng;
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        const locationDescription = locationText.textContent.replace('📍 ', '');
        
        // Calcular total
        let totalPrice = 0;
        selectedPizzas.forEach(pizza => {
            totalPrice += pizza.price * pizza.quantity;
        });
        
        // Construir mensaje para WhatsApp
        let message = `* Delis Pizza*\n\n`;
        message += `* Detalle Pedido:*\n`;
        message += `────────────────────\n`;
        
        selectedPizzas.forEach(pizza => {
            const subtotal = pizza.price * pizza.quantity;
            message += `• ${pizza.quantity}x ${pizza.name}\n`;
            message += `  ${pizza.quantity} x $${pizza.price} = $${subtotal}\n`;
        });
        
        message += `────────────────────\n`;
        message += `*Total: $${totalPrice} MXN*\n\n`;
        
        message += `* MI UBICACIÓN PARA ENTREGA:*\n`;
        message += `${locationDescription}\n`;
        message += `*Enlace de Google Maps:* ${mapsUrl}\n\n`;
        
        if (userMessage.value.trim()) {
            message += `*📝 INSTRUCCIONES ESPECIALES:*\n`;
            message += `${userMessage.value.trim()}\n\n`;
        }
        
        // message += `* HORARIO DE ENTREGA:*\n`;
        // message += `Lo antes posible\n\n`;
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
    
    // También enviar con Enter en textarea
    userMessage.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey && userLocation && selectedPizzas.length > 0) {
            e.preventDefault();
            sendWhatsApp.click();
        }
    });
    
    function resetForm() {
        userLocation = null;
        selectedPizzas = [];
        userMessage.value = '';
        locationText.textContent = 'Obteniendo ubicación...';
        locationStatus.classList.remove('location-success', 'location-error');
        orderSummary.style.display = 'none';
        itemCountElement.textContent = '0';
        
        // Deseleccionar todas las pizzas y resetear cantidades
        document.querySelectorAll('.pizza-option').forEach(opt => {
            opt.classList.remove('selected');
            opt.querySelector('.pizza-quantity').style.display = 'none';
            opt.querySelector('.quantity-value').textContent = '1';
        });
        
        updateSendButton();
    }
    
    // Actualizar botón cuando se escribe mensaje
    userMessage.addEventListener('input', updateSendButton);
    
    // Inicializar
    updateSendButton();
});