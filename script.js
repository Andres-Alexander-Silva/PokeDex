/* ============================================================
   POKÉDEX PRO — script.js
   Clase 8: APIs & Fetch
   ============================================================
   CONCEPTOS QUE APRENDERÁS AQUÍ:
   1. fetch() — cómo pedir datos a una API externa
   2. .then() — cómo manejar respuestas asíncronas (promesas)
   3. .catch() — cómo manejar errores de red
   4. JSON — cómo leer y usar la respuesta
   5. DOM Manipulation — cómo inyectar datos en el HTML
   6. Estado de la app — cómo guardar datos temporalmente
   ============================================================ */

// ============================================================
// 1. REFERENCIAS AL DOM
//    Guardamos en variables los elementos HTML que vamos a usar
// ============================================================
const inputPokemon = document.getElementById("pokemon-input");
const btnBuscar = document.getElementById("btn-buscar");
const btnRandom = document.getElementById("btn-random");
const btnShiny = document.getElementById("btn-shiny");
const btnGuardarA = document.getElementById("btn-guardar-a");
const btnGuardarB = document.getElementById("btn-guardar-b");
const btnLimpiar = document.getElementById("btn-limpiar");

const resultadoSection = document.getElementById("resultado-section");
const estadoCargando = document.getElementById("estado-cargando");
const estadoError = document.getElementById("estado-error");
const pokemonCard = document.getElementById("pokemon-card");
const errorMensaje = document.getElementById("error-mensaje");

const pokeId = document.getElementById("poke-id");
const pokeNombre = document.getElementById("poke-nombre");
const pokeSprite = document.getElementById("poke-sprite");
const pokeSpriteShiny = document.getElementById("poke-sprite-shiny");
const pokeTipos = document.getElementById("poke-tipos");
const pokeAltura = document.getElementById("poke-altura");
const pokePeso = document.getElementById("poke-peso");
const pokeExperiencia = document.getElementById("poke-experiencia");
const pokeHabilidades = document.getElementById("poke-habilidades");
const pokeStatsCombate = document.getElementById("poke-stats-combate");

const slotA = document.getElementById("slot-a");
const slotB = document.getElementById("slot-b");
const compareResultado = document.getElementById("compare-resultado");
const historialContainer = document.getElementById("historial-container");

// ============================================================
// 2. ESTADO DE LA APLICACIÓN
//    Variables que guardan el "estado" actual de la app
// ============================================================

let pokemonActual = null; // El último Pokémon buscado
let mostrandoShiny = false; // ¿Estamos mostrando el sprite shiny?
let comparacionA = null; // Pokémon guardado en el slot A
let comparacionB = null; // Pokémon guardado en el slot B
let historial = []; // Lista de búsquedas realizadas

// ============================================================
// 3. NOMBRES CORTOS PARA LAS ESTADÍSTICAS
//    Hacemos que los nombres de las stats sean más legibles
// ============================================================
const STAT_NOMBRES = {
  hp: "HP",
  attack: "ATAQUE",
  defense: "DEFENSA",
  "special-attack": "SP.ATK",
  "special-defense": "SP.DEF",
  speed: "VELOC.",
};

const STAT_CLASES = {
  hp: "bar-hp",
  attack: "bar-atk",
  defense: "bar-def",
  "special-attack": "bar-sp-atk",
  "special-defense": "bar-sp-def",
  speed: "bar-speed",
};

// ============================================================
// 4. FUNCIÓN PRINCIPAL: buscarPokemon()
//
//    AQUÍ ESTÁ EL CORAZÓN DEL EJERCICIO:
//    Esta función usa fetch() para pedirle datos a la PokeAPI
// ============================================================

function buscarPokemon(nombreOId) {
  // Limpiamos y normalizamos el texto ingresado
  const query = String(nombreOId).trim().toLowerCase();

  if (!query) {
    mostrarError("¡Escribe el nombre de un Pokémon primero!");
    return;
  }

  // Mostramos la sección de resultado y el estado "cargando"
  mostrarEstado("cargando");

  // ──────────────────────────────────────────────────────────
  //  FETCH: Le pedimos datos a la PokeAPI
  //
  //  fetch(url) devuelve una PROMESA.
  //  Una promesa es una operación que tarda tiempo
  //  (como esperar a que el mesero vuelva con el pedido).
  //
  //  .then() se ejecuta cuando la promesa se resuelve (éxito)
  //  .catch() se ejecuta si hay un error (ej: pokémon no existe)
  // ──────────────────────────────────────────────────────────

  console.log(
    `%c[API] Buscando: ${query}`,
    "color: #4cc9f0; font-weight: bold",
  );

  fetch(`https://pokeapi.co/api/v2/pokemon/${query}`)
    .then((respuesta) => {
      // El mesero llegó — ¿trajo algo válido?
      console.log(
        "%c[API] Respuesta recibida. Status:",
        "color: #ffd60a",
        respuesta.status,
      );

      if (!respuesta.ok) {
        // Si el status NO es 200-299, lanzamos un error
        throw new Error(
          `Pokémon "${query}" no encontrado (status ${respuesta.status})`,
        );
      }

      // El paquete llegó sellado. Debemos "abrirlo" con .json()
      // Esto también es asíncrono, por eso retornamos la promesa
      return respuesta.json();
    })

    .then((datos) => {
      // ¡Ya tenemos los datos como objeto JavaScript!
      console.log("%c[API] Datos listos:", "color: #2dc653", datos);

      // Guardamos el pokémon en el estado global
      pokemonActual = datos;
      mostrandoShiny = false;

      // Llamamos a la función que pinta la tarjeta
      renderizarPokemon(datos);

      // Agregamos al historial
      agregarAlHistorial(datos.name);

      // Habilitamos los botones de comparación
      btnGuardarA.disabled = false;
      btnGuardarB.disabled = false;
    })

    .catch((error) => {
      // Algo salió mal — avisamos al usuario
      console.error("%c[API] Error:", "color: #e63946", error.message);
      mostrarError(error.message);
    });
}

// ============================================================
// 5. RENDERIZAR EL POKÉMON EN EL DOM
//    Toma los datos JSON y los convierte en HTML visible
// ============================================================

function renderizarPokemon(datos) {
  // -- ID --
  pokeId.textContent = String(datos.id).padStart(3, "0");

  // -- Nombre --
  pokeNombre.textContent = datos.name.toUpperCase();

  // -- Sprites (imágenes) --
  pokeSprite.src = datos.sprites.front_default || "";
  pokeSprite.alt = datos.name;
  pokeSpriteShiny.src = datos.sprites.front_shiny || "";
  pokeSpriteShiny.alt = `${datos.name} shiny`;

  // Aseguramos que se muestre el sprite normal al buscar uno nuevo
  pokeSprite.classList.remove("hidden");
  pokeSpriteShiny.classList.add("hidden");

  // -- Datos físicos --
  // La API devuelve decímetros y hectogramos, convertimos a m y kg
  pokeAltura.textContent = `${(datos.height / 10).toFixed(1)} m`;
  pokePeso.textContent = `${(datos.weight / 10).toFixed(1)} kg`;
  pokeExperiencia.textContent = datos.base_experience ?? "???";

  // -- Tipos --
  pokeTipos.innerHTML = "";
  datos.types.forEach((entry) => {
    const badge = document.createElement("span");
    badge.className = `tipo-badge tipo-${entry.type.name}`;
    badge.textContent = entry.type.name.toUpperCase();
    pokeTipos.appendChild(badge);
  });

  // -- Habilidades --
  pokeHabilidades.innerHTML = "";
  datos.abilities.forEach((entry) => {
    const badge = document.createElement("span");
    badge.className = `habilidad-badge${entry.is_hidden ? " oculta" : ""}`;
    badge.textContent = entry.ability.name + (entry.is_hidden ? " 🔒" : "");
    badge.title = entry.is_hidden ? "Habilidad Oculta" : "Habilidad Normal";
    pokeHabilidades.appendChild(badge);
  });

  // -- Stats de combate --
  pokeStatsCombate.innerHTML = "";
  const MAX_STAT = 255; // El máximo teórico de cualquier stat

  datos.stats.forEach((entry) => {
    const nombreLegible = STAT_NOMBRES[entry.stat.name] || entry.stat.name;
    const claseColor = STAT_CLASES[entry.stat.name] || "bar-default";
    const porcentaje = Math.min((entry.base_stat / MAX_STAT) * 100, 100);

    const fila = document.createElement("div");
    fila.className = "stat-bar-row";
    fila.innerHTML = `
      <span class="stat-bar-label">${nombreLegible}</span>
      <span class="stat-bar-num">${entry.base_stat}</span>
      <div class="stat-bar-track">
        <div class="stat-bar-fill ${claseColor}" data-ancho="${porcentaje}"></div>
      </div>
    `;
    pokeStatsCombate.appendChild(fila);
  });

  // Mostramos la tarjeta
  mostrarEstado("card");

  // Animamos las barras (pequeño delay para que se vea el efecto)
  setTimeout(() => {
    document.querySelectorAll(".stat-bar-fill").forEach((barra) => {
      barra.style.width = barra.dataset.ancho + "%";
    });
  }, 100);
}

// ============================================================
// 6. MANEJO DE ESTADOS VISUALES
//    Controlamos qué se muestra en cada momento
// ============================================================

function mostrarEstado(estado) {
  // Primero quitamos todo
  resultadoSection.classList.remove("hidden");
  estadoCargando.classList.add("hidden");
  estadoError.classList.add("hidden");
  pokemonCard.classList.add("hidden");

  // Luego mostramos solo lo que necesitamos
  if (estado === "cargando") estadoCargando.classList.remove("hidden");
  if (estado === "error") estadoError.classList.remove("hidden");
  if (estado === "card") pokemonCard.classList.remove("hidden");
}

function mostrarError(mensaje) {
  errorMensaje.textContent = mensaje;
  mostrarEstado("error");
}

// ============================================================
// 7. TOGGLE SHINY
//    Alternamos entre sprite normal y shiny
// ============================================================

function toggleShiny() {
  mostrandoShiny = !mostrandoShiny;

  if (mostrandoShiny) {
    pokeSprite.classList.add("hidden");
    pokeSpriteShiny.classList.remove("hidden");
    btnShiny.textContent = "🌟 Ver Normal";
  } else {
    pokeSprite.classList.remove("hidden");
    pokeSpriteShiny.classList.add("hidden");
    btnShiny.textContent = "✨ Ver Shiny";
  }
}

// ============================================================
// 8. MODO COMPARACIÓN
//    Guardamos un Pokémon en el slot A o B y comparamos
// ============================================================

function guardarEnSlot(slot) {
  if (!pokemonActual) return;

  const datos = pokemonActual;
  const totalStats = datos.stats.reduce((suma, s) => suma + s.base_stat, 0);

  const miniCard = document.createElement("div");
  miniCard.style.display = "flex";
  miniCard.style.flexDirection = "column";
  miniCard.style.alignItems = "center";
  miniCard.style.gap = "6px";
  miniCard.innerHTML = `
    <img src="${datos.sprites.front_default}" class="compare-mini-sprite" alt="${datos.name}">
    <p class="compare-mini-nombre">${datos.name}</p>
    <p class="compare-mini-total">Total: ${totalStats}</p>
  `;

  if (slot === "A") {
    comparacionA = datos;
    slotA.innerHTML = "";
    slotA.appendChild(miniCard);
    slotA.classList.add("filled");
  } else {
    comparacionB = datos;
    slotB.innerHTML = "";
    slotB.appendChild(miniCard);
    slotB.classList.add("filled");
  }

  if (comparacionA && comparacionB) {
    mostrarComparacion();
  }
}

function mostrarComparacion() {
  compareResultado.classList.remove("hidden");
  compareResultado.innerHTML = "<h4>📊 RESULTADO DE LA COMPARACIÓN</h4>";

  const statsIds = [
    "hp",
    "attack",
    "defense",
    "special-attack",
    "special-defense",
    "speed",
  ];

  statsIds.forEach((statId) => {
    const statA =
      comparacionA.stats.find((s) => s.stat.name === statId)?.base_stat ?? 0;
    const statB =
      comparacionB.stats.find((s) => s.stat.name === statId)?.base_stat ?? 0;
    const nombre = STAT_NOMBRES[statId] || statId;

    const fila = document.createElement("div");
    fila.className = "compare-stat-row";
    fila.innerHTML = `
      <span class="cmp-a ${statA > statB ? "cmp-winner" : statA < statB ? "cmp-loser" : ""}">
        ${statA}
      </span>
      <span class="cmp-label">${nombre}</span>
      <span class="cmp-b ${statB > statA ? "cmp-winner" : statB < statA ? "cmp-loser" : ""}">
        ${statB}
      </span>
    `;
    compareResultado.appendChild(fila);
  });

  const totalA = comparacionA.stats.reduce((s, e) => s + e.base_stat, 0);
  const totalB = comparacionB.stats.reduce((s, e) => s + e.base_stat, 0);

  const ganador =
    totalA > totalB
      ? comparacionA.name.toUpperCase()
      : totalB > totalA
        ? comparacionB.name.toUpperCase()
        : "¡EMPATE!";

  const resumen = document.createElement("p");
  resumen.style.cssText =
    "margin-top:14px; font-family:var(--font-pixel); font-size:10px; color:var(--accent-gold); text-align:center;";
  resumen.textContent = `🏆 Ganador por total de stats: ${ganador} (${Math.max(totalA, totalB)} pts)`;
  compareResultado.appendChild(resumen);
}

// ============================================================
// 9. HISTORIAL DE BÚSQUEDAS
// ============================================================

function agregarAlHistorial(nombre) {
  if (historial.includes(nombre)) return; // No duplicamos

  historial.unshift(nombre); // Agregamos al inicio
  if (historial.length > 15) historial.pop(); // Máximo 15

  renderizarHistorial();
}

function renderizarHistorial() {
  historialContainer.innerHTML = "";

  if (historial.length === 0) {
    historialContainer.innerHTML =
      '<p class="historial-empty">Aún no has buscado ningún Pokémon.</p>';
    return;
  }

  historial.forEach((nombre) => {
    const chip = document.createElement("button");
    chip.className = "historial-item";
    chip.innerHTML = `<span>📌</span> ${nombre}`;
    chip.addEventListener("click", () => buscarPokemon(nombre));
    historialContainer.appendChild(chip);
  });
}

// ============================================================
// 10. POKÉMON ALEATORIO
//     Genera un ID al azar y busca ese Pokémon
// ============================================================

function buscarAleatorio() {
  // Hay 1025 Pokémon en la API (generaciones 1-9)
  const idAleatorio = Math.floor(Math.random() * 1025) + 1;
  console.log(`%c[Random] ID generado: ${idAleatorio}`, "color: #ffd60a");
  buscarPokemon(idAleatorio);
}

// ============================================================
// 11. EVENT LISTENERS
//     Conectamos los botones con las funciones
// ============================================================

// Botón "BUSCAR"
btnBuscar.addEventListener("click", () => {
  buscarPokemon(inputPokemon.value);
});

// Tecla Enter en el input
inputPokemon.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") {
    buscarPokemon(inputPokemon.value);
  }
});

// Botón aleatorio
btnRandom.addEventListener("click", buscarAleatorio);

// Botón shiny
btnShiny.addEventListener("click", toggleShiny);

// Botones de comparación
btnGuardarA.addEventListener("click", () => guardarEnSlot("A"));
btnGuardarB.addEventListener("click", () => guardarEnSlot("B"));

// Botones de acceso rápido (chips)
document.querySelectorAll(".btn-chip[data-pokemon]").forEach((btn) => {
  btn.addEventListener("click", () => {
    buscarPokemon(btn.dataset.pokemon);
  });
});

// Limpiar historial
btnLimpiar.addEventListener("click", () => {
  historial = [];
  renderizarHistorial();
});

// ============================================================
// 12. INICIO: cargamos un Pokémon por defecto al abrir la página
// ============================================================

buscarPokemon("pikachu");