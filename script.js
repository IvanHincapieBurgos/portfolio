/* ==========================================================================
   Portafolio · Iván Hincapié
   Lógica de interacción compartida por index.html y proyectos.html
   --------------------------------------------------------------------------
   Bloque 1 · Formulario de contacto (index.html)
              Validación en cliente. NO envía datos a ningún servidor:
              siempre se llama a preventDefault() y se simula el éxito.
   Bloque 2 · Filtro de proyectos por tecnología (proyectos.html)
   ========================================================================== */

/* ==========================================================================
   BLOQUE 1 · FORMULARIO DE CONTACTO
   ========================================================================== */
(function inicializarFormulario() {
    'use strict';

    const formulario = document.getElementById('contact-form');

    // La página de proyectos no tiene formulario: salimos sin hacer nada.
    if (!formulario) return;

    const MIN_PALABRAS = 10;
    const MAX_PALABRAS = 200;

    const campoNombre = document.getElementById('nombre');
    const campoCorreo = document.getElementById('correo');
    const campoFecha = document.getElementById('fecha');
    const campoMensaje = document.getElementById('mensaje');
    const contador = document.getElementById('word-counter');
    const estado = document.getElementById('form-status');

    /**
     * Cuenta las palabras de un texto.
     * trim() descarta los espacios de los extremos, split(/\s+/) separa por
     * cualquier bloque de espacios, saltos de línea o tabulaciones, y
     * filter(Boolean) elimina las cadenas vacías que quedan cuando el campo
     * está en blanco. Así "  hola   mundo  " cuenta 2 y "" cuenta 0.
     */
    function contarPalabras(texto) {
        return texto.trim().split(/\s+/).filter(Boolean).length;
    }

    /** Valida el formato del correo con una expresión regular básica. */
    function correoEsValido(valor) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
    }

    /** Devuelve la fecha de hoy en formato YYYY-MM-DD (comparable como texto). */
    function fechaDeHoy() {
        const hoy = new Date();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        return `${hoy.getFullYear()}-${mes}-${dia}`;
    }

    /** Muestra el mensaje de estado del formulario (error o éxito). */
    function mostrarEstado(mensaje, tipo) {
        estado.textContent = mensaje;
        estado.className = `form-status is-${tipo}`;
    }

    function ocultarEstado() {
        estado.textContent = '';
        estado.className = 'form-status hidden';
    }

    /** Limpia las marcas visuales de error de todos los campos. */
    function limpiarMarcas() {
        formulario.querySelectorAll('.is-invalid').forEach(function (campo) {
            campo.classList.remove('is-invalid');
        });
    }

    /** Actualiza el contador de palabras que se muestra bajo el textarea. */
    function actualizarContador() {
        const total = contarPalabras(campoMensaje.value);
        const fueraDeRango = total > 0 && (total < MIN_PALABRAS || total > MAX_PALABRAS);

        contador.textContent = `${total} palabras (mínimo ${MIN_PALABRAS}, máximo ${MAX_PALABRAS})`;
        contador.classList.toggle('is-out', fueraDeRango);
    }

    /**
     * Recorre las reglas de validación y devuelve el primer error encontrado,
     * o null si el formulario es válido.
     */
    function validar() {
        const palabras = contarPalabras(campoMensaje.value);

        const reglas = [
            {
                valido: campoNombre.value.trim().length >= 2,
                campo: campoNombre,
                mensaje: 'Escribe tu nombre (mínimo 2 caracteres).'
            },
            {
                valido: correoEsValido(campoCorreo.value.trim()),
                campo: campoCorreo,
                mensaje: 'Escribe un correo válido, por ejemplo nombre@empresa.com.'
            },
            {
                valido: campoFecha.value !== '',
                campo: campoFecha,
                mensaje: 'Selecciona una fecha tentativa de contacto.'
            },
            {
                valido: campoFecha.value === '' || campoFecha.value >= fechaDeHoy(),
                campo: campoFecha,
                mensaje: 'La fecha tentativa no puede estar en el pasado.'
            },
            {
                valido: formulario.querySelector('input[name="modalidad"]:checked') !== null,
                campo: document.getElementById('remoto'),
                mensaje: 'Elige una modalidad de trabajo.'
            },
            {
                valido: palabras >= MIN_PALABRAS,
                campo: campoMensaje,
                mensaje: `El mensaje necesita al menos ${MIN_PALABRAS} palabras. Llevas ${palabras}.`
            },
            {
                valido: palabras <= MAX_PALABRAS,
                campo: campoMensaje,
                mensaje: `El mensaje no puede superar las ${MAX_PALABRAS} palabras. Llevas ${palabras}.`
            }
        ];

        return reglas.find(function (regla) { return !regla.valido; }) || null;
    }

    // El contador se actualiza mientras la persona escribe.
    campoMensaje.addEventListener('input', actualizarContador);

    formulario.addEventListener('submit', function (evento) {
        // El formulario es una demostración: nunca se envía a un servidor.
        evento.preventDefault();

        limpiarMarcas();
        const error = validar();

        if (error) {
            error.campo.classList.add('is-invalid');
            mostrarEstado(error.mensaje, 'error');
            error.campo.focus();
            return;
        }

        // Simulación de éxito: se confirma y se limpian los campos.
        mostrarEstado('¡Gracias! Me pondré en contacto contigo pronto.', 'success');
        formulario.reset();
        actualizarContador();
    });

    // Al escribir de nuevo, se retira el mensaje de error anterior.
    formulario.addEventListener('input', function () {
        if (estado.classList.contains('is-error')) {
            limpiarMarcas();
            ocultarEstado();
        }
    });

    actualizarContador();
}());

/* ==========================================================================
   BLOQUE 2 · FILTRO DE PROYECTOS POR TECNOLOGÍA
   ========================================================================== */
(function inicializarFiltro() {
    'use strict';

    const filtro = document.getElementById('tech-filter');

    // La página de inicio no tiene filtro: salimos sin hacer nada.
    if (!filtro) return;

    const tarjetas = document.querySelectorAll('.project-card');
    const resultado = document.getElementById('filter-result');
    const botonLimpiar = document.getElementById('clear-filter');

    /**
     * Devuelve la lista de tecnologías declaradas en data-tech.
     * El atributo usa slugs en minúscula separados por coma
     * (ej. "python,sql,aws"), que coinciden exactamente con el value
     * de cada radio del filtro. Se compara por token completo para que
     * "sql" no dé un falso positivo dentro de otra palabra.
     */
    function tecnologiasDe(tarjeta) {
        return (tarjeta.dataset.tech || '')
            .toLowerCase()
            .split(',')
            .map(function (tecnologia) { return tecnologia.trim(); })
            .filter(Boolean);
    }

    /** Devuelve la etiqueta legible del filtro activo (ej. "Power BI"). */
    function etiquetaDe(valor) {
        const radio = filtro.querySelector(`input[value="${valor}"]`);
        const etiqueta = radio && filtro.querySelector(`label[for="${radio.id}"]`);
        return etiqueta ? etiqueta.textContent : valor;
    }

    /**
     * Muestra u oculta las tarjetas según la tecnología seleccionada.
     * Un valor vacío significa "ver todos".
     */
    function filtrarProyectos(tecnologia) {
        const total = tarjetas.length;
        let coincidencias = 0;

        tarjetas.forEach(function (tarjeta) {
            const visible = tecnologia === '' || tecnologiasDe(tarjeta).includes(tecnologia);

            // La clase .hidden usa !important, así que respeta el display:flex
            // que la tarjeta necesita cuando vuelve a ser visible.
            tarjeta.classList.toggle('hidden', !visible);
            if (visible) coincidencias += 1;
        });

        if (tecnologia === '') {
            resultado.textContent = `Mostrando los ${total} proyectos.`;
            resultado.classList.remove('is-empty');
        } else if (coincidencias === 0) {
            resultado.textContent = `No hay proyectos con ${etiquetaDe(tecnologia)} todavía.`;
            resultado.classList.add('is-empty');
        } else {
            resultado.textContent = `Mostrando ${coincidencias} de ${total} proyectos con ${etiquetaDe(tecnologia)}.`;
            resultado.classList.remove('is-empty');
        }
    }

    filtro.addEventListener('change', function (evento) {
        if (evento.target.name !== 'tecnologia') return;
        filtrarProyectos(evento.target.value.toLowerCase());
    });

    botonLimpiar.addEventListener('click', function () {
        filtro.querySelectorAll('input[name="tecnologia"]').forEach(function (radio) {
            radio.checked = false;
        });
        filtrarProyectos('');
    });

    filtrarProyectos('');
}());
