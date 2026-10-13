/* En el sitio, acceso.js deja aquí una promesa que se resuelve cuando la
   cuenta puede leer; sin ella (edición suelta) el lector arranca de inmediato. */
const iniciarLector = () => {
  const ANCHO = 612;
  const ALTO = 792;
  const PROPORCION = ANCHO / ALTO;
  const MIN_PAGINA = 260;
  const MIN_DOBLE = 720;

  const escenario = document.getElementById('escenario');
  const marco = document.getElementById('marco');
  const libro = document.getElementById('libro');
  const folio = document.getElementById('folio');
  const anterior = document.getElementById('anterior');
  const siguiente = document.getElementById('siguiente');
  const pista = document.getElementById('pista');
  const miniaturas = document.getElementById('miniaturas');
  const pantalla = document.getElementById('pantalla');
  const paginas = [...libro.querySelectorAll('.pagina')];
  const total = paginas.length;
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Portada sola; después, pares de hojas; la contraportada queda sola si el total es par. */
  const GRUPOS = [[0]];
  for (let i = 1; i < total; i += 2) GRUPOS.push(i + 1 < total ? [i, i + 1] : [i]);

  /* Numeral pixelado, con la misma retícula cuadrada del logo */
  const GLIFOS = {
    0: ['#####', '#...#', '#...#', '#...#', '#...#', '#...#', '#####'],
    1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '#####'],
    2: ['#####', '....#', '....#', '#####', '#....', '#....', '#####'],
    3: ['#####', '....#', '....#', '.####', '....#', '....#', '#####'],
    4: ['#...#', '#...#', '#...#', '#####', '....#', '....#', '....#'],
    5: ['#####', '#....', '#....', '#####', '....#', '....#', '#####'],
    6: ['#####', '#....', '#....', '#####', '#...#', '#...#', '#####'],
    7: ['#####', '....#', '....#', '....#', '....#', '....#', '....#'],
    8: ['#####', '#...#', '#...#', '#####', '#...#', '#...#', '#####'],
    9: ['#####', '#...#', '#...#', '#####', '....#', '....#', '#####'],
  };

  function pintarPixel(el) {
    const caracteres = [...el.dataset.pixel];
    const columnas = caracteres.length * 6 - 1;
    el.style.setProperty('--columnas', columnas);
    for (let fila = 0; fila < 7; fila++) {
      for (let c = 0; c < columnas; c++) {
        const glifo = GLIFOS[caracteres[Math.floor(c / 6)]];
        const columna = c % 6;
        const celda = document.createElement('i');
        if (columna < 5 && glifo && glifo[fila][columna] === '#') celda.className = 'is-lleno';
        celda.style.setProperty('--i', fila + c);
        el.append(celda);
      }
    }
  }

  function pintarPuntos(el) {
    const llenos = Number(el.dataset.puntos);
    for (let n = 0; n < 100; n++) {
      const punto = document.createElement('i');
      if (n < llenos) punto.className = 'is-lleno';
      punto.style.setProperty('--i', n);
      el.append(punto);
    }
  }

  /* Red de dependencias: el centro es la empresa, el primer anillo lo que instala
     y el segundo, quienes mantienen eso que instaló. Una ruta queda marcada. */
  function pintarRed(el) {
    const NS = 'http://www.w3.org/2000/svg';
    const directas = Number(el.dataset.red) || 40;
    let semilla = 11;
    const azar = () => {
      semilla = (semilla * 16807) % 2147483647;
      return (semilla - 1) / 2147483646;
    };
    const crear = (tipo, atributos) => {
      const nodo = document.createElementNS(NS, tipo);
      Object.entries(atributos).forEach(([k, v]) => nodo.setAttribute(k, v));
      return nodo;
    };

    const svg = crear('svg', { viewBox: '-100 -100 200 200', 'aria-hidden': 'true' });
    const lineas = crear('g', { class: 'red__lineas' });
    const lejanos = crear('g', { class: 'red__lejanos' });
    const directos = crear('g', { class: 'red__directos' });
    const ruta = crear('g', { class: 'red__ruta' });
    const marcada = Math.floor(directas * 0.36);

    for (let n = 0; n < directas; n++) {
      const angulo = (n / directas) * Math.PI * 2 - Math.PI / 2;
      const r1 = 33 + azar() * 9;
      const x1 = Math.cos(angulo) * r1;
      const y1 = Math.sin(angulo) * r1;
      const esRuta = n === marcada;
      (esRuta ? ruta : lineas).append(crear('line', { x1: 0, y1: 0, x2: x1.toFixed(2), y2: y1.toFixed(2) }));

      const hijos = 3 + Math.floor(azar() * 3);
      for (let h = 0; h < hijos; h++) {
        const a2 = angulo + (azar() - 0.5) * 0.4;
        const r2 = 58 + azar() * 36;
        const x2 = Math.cos(a2) * r2;
        const y2 = Math.sin(a2) * r2;
        const esFinal = esRuta && h === 0;
        (esFinal ? ruta : lineas).append(crear('line', { x1: x1.toFixed(2), y1: y1.toFixed(2), x2: x2.toFixed(2), y2: y2.toFixed(2) }));
        const punto = crear('circle', { cx: x2.toFixed(2), cy: y2.toFixed(2), r: (0.8 + azar() * 0.7).toFixed(2) });
        if (esFinal) {
          punto.setAttribute('r', '3.2');
          ruta.append(crear('circle', { class: 'red__halo', cx: x2.toFixed(2), cy: y2.toFixed(2), r: '7' }), punto);
        } else {
          lejanos.append(punto);
        }
      }
      const directo = crear('circle', { cx: x1.toFixed(2), cy: y1.toFixed(2), r: esRuta ? '2.4' : '1.7' });
      (esRuta ? ruta : directos).append(directo);
    }

    svg.append(lineas, lejanos, directos, ruta, crear('rect', { class: 'red__centro', x: -6, y: -6, width: 12, height: 12 }));
    el.append(svg);
  }

  document.querySelectorAll('[data-pixel]').forEach(pintarPixel);
  document.querySelectorAll('[data-puntos]').forEach(pintarPuntos);
  document.querySelectorAll('[data-red]').forEach(pintarRed);

  /* Miniaturas: copia de cada hoja a escala, ya en su estado final */
  function crearMiniaturas() {
    GRUPOS.forEach((grupo) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'miniatura';
      let etiqueta = `Ir a la página ${grupo[0] + 1}`;
      if (grupo.length > 1) etiqueta = `Ir a las páginas ${grupo[0] + 1} y ${grupo[1] + 1}`;
      else if (grupo[0] === 0) etiqueta = 'Ir a la portada';
      else if (grupo[0] === total - 1) etiqueta = 'Ir a la contraportada';
      boton.setAttribute('aria-label', etiqueta);

      const hojas = document.createElement('span');
      hojas.className = 'miniatura__hojas';
      hojas.setAttribute('aria-hidden', 'true');

      grupo.forEach((indice) => {
        const hoja = document.createElement('span');
        hoja.className = 'miniatura__hoja';
        const copia = document.createElement('div');
        copia.className = `${paginas[indice].className} is-visible`;
        copia.innerHTML = paginas[indice].innerHTML;
        copia.querySelectorAll('img').forEach((img) => {
          img.alt = '';
          img.loading = 'lazy';
        });
        copia.querySelectorAll('[role], [aria-label]').forEach((nodo) => {
          nodo.removeAttribute('role');
          nodo.removeAttribute('aria-label');
        });
        copia.querySelectorAll('[id]').forEach((nodo) => nodo.removeAttribute('id'));
        hoja.append(copia);
        hojas.append(hoja);
      });

      const numero = document.createElement('span');
      numero.className = 'miniatura__num';
      numero.textContent = grupo.map((i) => String(i + 1).padStart(2, '0')).join('–');

      boton.append(hojas, numero);
      boton.addEventListener('click', () => irA(grupo[0]));
      miniaturas.append(boton);
    });
  }

  crearMiniaturas();
  const botonesMini = [...miniaturas.children];

  function centrarMiniatura(boton) {
    if (!boton || miniaturas.scrollWidth <= miniaturas.clientWidth) return;
    const tira = miniaturas.getBoundingClientRect();
    const caja = boton.getBoundingClientRect();
    miniaturas.scrollTo({
      left: miniaturas.scrollLeft + (caja.left - tira.left) - (tira.width - caja.width) / 2,
      behavior: sinMovimiento.matches ? 'auto' : 'smooth',
    });
  }

  /* El libro ocupa el mayor tamaño que quepa en el escenario:
     a doble página en escritorio, una sola hoja en móvil. */
  function medir() {
    const estilo = getComputedStyle(escenario);
    const ancho = escenario.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
    const alto = escenario.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom);
    const doble = window.innerWidth > MIN_DOBLE;
    const medida = doble
      ? Math.max(MIN_PAGINA * 2, Math.min(ancho, alto * PROPORCION * 2))
      : Math.max(MIN_PAGINA, Math.min(ancho, alto * PROPORCION, MIN_PAGINA * 2 - 1));
    marco.style.width = `${Math.floor(medida)}px`;
  }

  window.addEventListener('resize', medir);
  medir();

  const flip = new St.PageFlip(libro, {
    width: ANCHO,
    height: ALTO,
    size: 'stretch',
    minWidth: MIN_PAGINA,
    maxWidth: 2000,
    minHeight: 100,
    maxHeight: 3000,
    showCover: true,
    usePortrait: true,
    autoSize: true,
    drawShadow: true,
    maxShadowOpacity: 0.45,
    flippingTime: 900,
    mobileScrollSupport: false,
    showPageCorners: true,
  });

  flip.loadFromHTML(paginas);

  function visibles(indice) {
    if (flip.getOrientation() === 'portrait') return [indice];
    if (indice === 0) return [0];
    const izquierda = indice % 2 === 1 ? indice : indice - 1;
    return [izquierda, izquierda + 1].filter((i) => i < total);
  }

  function contar(el) {
    const meta = Number(el.dataset.contar);
    const decimales = (el.dataset.contar.split('.')[1] || '').length;
    const formato = (n) => n.toLocaleString('es-MX', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
    if (sinMovimiento.matches) {
      el.textContent = formato(meta);
      return;
    }
    const inicio = performance.now() + 350;
    const duracion = 1300;
    el.textContent = formato(0);
    const paso = (ahora) => {
      const t = Math.min(1, Math.max(0, (ahora - inicio) / duracion));
      const valor = meta * (1 - Math.pow(1 - t, 4));
      el.textContent = formato(decimales ? valor : Math.round(valor));
      if (t < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  let mostradas = [];

  function revelar(indices) {
    paginas.forEach((pagina, i) => {
      const entra = indices.includes(i) && !mostradas.includes(i);
      pagina.classList.toggle('is-visible', indices.includes(i));
      if (entra) pagina.querySelectorAll('[data-contar]').forEach(contar);
    });
    mostradas = indices;
  }

  /* Al levantar la hoja, la página que aparece debajo ya empieza a componerse */
  function alEmpezarGiro() {
    ocultarPista();
    const actuales = visibles(flip.getCurrentPageIndex());
    const vecinas = new Set(actuales);
    actuales.forEach((i) => {
      [i - 2, i - 1, i + 1, i + 2].forEach((v) => {
        if (v >= 0 && v < total) vecinas.add(v);
      });
    });
    revelar([...vecinas]);
    if (marco.dataset.pos === 'portada' || marco.dataset.pos === 'contra') marco.dataset.pos = 'doble';
  }

  function actualizar(indice) {
    const vista = visibles(indice);
    const vertical = flip.getOrientation() === 'portrait';

    revelar(vista);

    let posicion = 'doble';
    if (vertical) posicion = 'sencilla';
    else if (vista.length === 1 && vista[0] === 0) posicion = 'portada';
    else if (vista.length === 1 && vista[0] === total - 1) posicion = 'contra';
    marco.dataset.pos = posicion;

    if (indice !== paginaZoom) {
      paginaZoom = indice;
      panX = 0;
      panY = 0;
      escribirZoom();
    }

    folio.textContent = `${vista.map((i) => i + 1).join('–')} / ${total}`;
    anterior.disabled = vista[0] === 0;
    siguiente.disabled = vista[vista.length - 1] === total - 1;

    let activo = null;
    botonesMini.forEach((boton, g) => {
      const esActivo = GRUPOS[g].some((i) => vista.includes(i));
      boton.setAttribute('aria-current', esActivo ? 'true' : 'false');
      if (esActivo && !activo) activo = boton;
    });
    centrarMiniatura(activo);
  }

  function irA(indice) {
    if (visibles(flip.getCurrentPageIndex()).includes(indice)) return;
    flip.flip(indice);
  }

  let pistaVisible = true;
  function ocultarPista() {
    if (!pistaVisible) return;
    pistaVisible = false;
    pista.classList.add('is-oculta');
  }

  let girando = false;

  flip.on('flip', (e) => {
    ocultarPista();
    actualizar(e.data);
  });
  flip.on('changeOrientation', () => actualizar(flip.getCurrentPageIndex()));
  flip.on('changeState', (e) => {
    if (e.data === 'user_fold' || e.data === 'flipping') {
      if (!girando) alEmpezarGiro();
      girando = true;
    } else if (e.data === 'read') {
      girando = false;
      actualizar(flip.getCurrentPageIndex());
    }
  });

  anterior.addEventListener('click', () => flip.flipPrev());
  siguiente.addEventListener('click', () => flip.flipNext());

  /* Zoom: la página crece desde su centro visible y, ya ampliada, se arrastra. */
  const PASOS = [1, 1.5, 2, 2.5];
  const zoomMenos = document.getElementById('zoom-menos');
  const zoomMas = document.getElementById('zoom-mas');
  const zoomNivel = document.getElementById('zoom-nivel');
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let paginaZoom = 0;
  let quieto = 0;

  function origenX() {
    if (window.innerWidth <= 720) return 0.5;
    if (marco.dataset.pos === 'portada') return 0.75;
    if (marco.dataset.pos === 'contra') return 0.25;
    return 0.5;
  }

  function desfaseDe(ancho) {
    if (window.innerWidth <= 720) return 0;
    if (marco.dataset.pos === 'portada') return -0.25 * ancho;
    if (marco.dataset.pos === 'contra') return 0.25 * ancho;
    return 0;
  }

  function caja() {
    const estilo = getComputedStyle(escenario);
    const padL = parseFloat(estilo.paddingLeft);
    const padR = parseFloat(estilo.paddingRight);
    const padT = parseFloat(estilo.paddingTop);
    const padB = parseFloat(estilo.paddingBottom);
    const parent = escenario.getBoundingClientRect();
    const w = marco.offsetWidth;
    const h = marco.offsetHeight;
    return {
      left: parent.left + padL + (escenario.clientWidth - padL - padR - w) / 2,
      top: parent.top + padT + (escenario.clientHeight - padT - padB - h) / 2,
      w,
      h,
    };
  }

  function limitarPan() {
    const c = caja();
    const unaSola = window.innerWidth <= 720 || marco.dataset.pos === 'portada' || marco.dataset.pos === 'contra';
    const anchoVisible = unaSola ? c.w / (marco.dataset.pos === 'sencilla' || window.innerWidth <= 720 ? 1 : 2) : c.w;
    const stage = escenario.getBoundingClientRect();
    const maxX = Math.max(0, (anchoVisible * zoom - stage.width) / 2);
    const maxY = Math.max(0, (c.h * zoom - stage.height) / 2);
    panX = Math.min(maxX, Math.max(-maxX, panX));
    panY = Math.min(maxY, Math.max(-maxY, panY));
  }

  function escribirZoom() {
    if (zoom <= 1.001) {
      zoom = 1;
      panX = 0;
      panY = 0;
    } else {
      limitarPan();
    }
    marco.classList.toggle('is-zoom', zoom > 1);
    if (flip.setting) flip.setting.showPageCorners = zoom <= 1;
    marco.style.setProperty('--zoom', zoom.toFixed(3));
    marco.style.setProperty('--pan-x', `${panX.toFixed(1)}px`);
    marco.style.setProperty('--pan-y', `${panY.toFixed(1)}px`);
    zoomNivel.textContent = `${Math.round(zoom * 100)}%`;
    zoomMenos.disabled = zoom <= 1;
    zoomMas.disabled = zoom >= 2.5 - 0.01;
  }

  function aplicarZoom(animar) {
    escribirZoom();
    if (animar) {
      window.clearTimeout(quieto);
      marco.classList.remove('is-quieto');
      return;
    }
    marco.classList.add('is-quieto');
    window.clearTimeout(quieto);
    quieto = window.setTimeout(() => marco.classList.remove('is-quieto'), 90);
  }

  function zoomHacia(nuevo, cx, cy, animar) {
    nuevo = Math.min(2.5, Math.max(1, nuevo));
    if (nuevo === 1) {
      zoom = 1;
      panX = 0;
      panY = 0;
      aplicarZoom(animar);
      return;
    }
    const c = caja();
    const ox = origenX() * c.w;
    const oy = c.h / 2;
    const desfase = desfaseDe(c.w);
    const lx = ox + (cx - c.left - ox - desfase - panX) / zoom;
    const ly = oy + (cy - c.top - oy - panY) / zoom;
    zoom = nuevo;
    panX = cx - c.left - ox - (lx - ox) * zoom - desfase;
    panY = cy - c.top - oy - (ly - oy) * zoom;
    aplicarZoom(animar);
  }

  function centroEscenario() {
    const r = escenario.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function paso(direccion) {
    const centro = centroEscenario();
    const destino = direccion > 0
      ? PASOS.find((pasoZoom) => pasoZoom > zoom + 0.02) || 2.5
      : [...PASOS].reverse().find((pasoZoom) => pasoZoom < zoom - 0.02) || 1;
    zoomHacia(destino, centro.x, centro.y, true);
  }

  zoomMas.addEventListener('click', () => paso(1));
  zoomMenos.addEventListener('click', () => paso(-1));

  document.addEventListener('wheel', (e) => {
    if (!escenario.contains(e.target)) return;
    e.preventDefault();
    const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomHacia(zoom * Math.exp(-delta * 0.0016), e.clientX, e.clientY, false);
    if (zoom > 1) ocultarPista();
  }, { passive: false, capture: true });

  /* Con el click sostenido se arrastra la página. El giro de hoja no se entera. */
  let arrastre = null;

  function tomarArrastre(x, y) {
    arrastre = { x, y, panX, panY };
    marco.classList.add('is-arrastrando');
  }

  marco.addEventListener('mousedown', (e) => {
    if (zoom <= 1 || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    tomarArrastre(e.clientX, e.clientY);
  }, true);

  marco.addEventListener('touchstart', (e) => {
    if (zoom <= 1 || e.touches.length !== 1) return;
    e.preventDefault();
    e.stopPropagation();
    tomarArrastre(e.touches[0].clientX, e.touches[0].clientY);
  }, { capture: true, passive: false });

  window.addEventListener('mousemove', (e) => {
    if (!arrastre) return;
    panX = arrastre.panX + e.clientX - arrastre.x;
    panY = arrastre.panY + e.clientY - arrastre.y;
    aplicarZoom(false);
  });

  window.addEventListener('touchmove', (e) => {
    if (!arrastre || e.touches.length !== 1) return;
    e.preventDefault();
    panX = arrastre.panX + e.touches[0].clientX - arrastre.x;
    panY = arrastre.panY + e.touches[0].clientY - arrastre.y;
    aplicarZoom(false);
  }, { passive: false });

  const soltarArrastre = () => {
    if (!arrastre) return;
    arrastre = null;
    marco.classList.remove('is-arrastrando');
  };
  window.addEventListener('mouseup', soltarArrastre);
  window.addEventListener('touchend', soltarArrastre);
  window.addEventListener('touchcancel', soltarArrastre);

  const dedos = new Map();
  let pinza = null;

  escenario.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dedos.size === 2) {
      const [a, b] = [...dedos.values()];
      pinza = {
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        zoom,
      };
    }
  });
  escenario.addEventListener('pointermove', (e) => {
    if (!dedos.has(e.pointerId)) return;
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dedos.size < 2 || !pinza) return;
    const [a, b] = [...dedos.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    zoomHacia(pinza.zoom * (dist / pinza.dist), (a.x + b.x) / 2, (a.y + b.y) / 2, false);
  });
  const soltarDedo = (e) => {
    dedos.delete(e.pointerId);
    if (dedos.size < 2) pinza = null;
  };
  escenario.addEventListener('pointerup', soltarDedo);
  escenario.addEventListener('pointercancel', soltarDedo);

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      flip.flipNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      flip.flipPrev();
    } else if (e.key === 'Home') {
      irA(0);
    } else if (e.key === 'End') {
      irA(total - 1);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      paso(1);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      paso(-1);
    } else if (e.key === '0' || (e.key === 'Escape' && zoom > 1)) {
      e.preventDefault();
      const centro = centroEscenario();
      zoomHacia(1, centro.x, centro.y, true);
    }
  });

  if (document.fullscreenEnabled) {
    pantalla.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    });
    document.addEventListener('fullscreenchange', () => {
      pantalla.setAttribute('aria-label', document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa');
    });
  } else {
    pantalla.hidden = true;
  }

  window.setTimeout(ocultarPista, 7000);

  requestAnimationFrame(() => actualizar(flip.getCurrentPageIndex()));
};

(window.revistaAcceso || Promise.resolve()).then(iniciarLector);
