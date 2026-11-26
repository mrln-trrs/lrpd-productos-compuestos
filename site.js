/* Interacciones del portafolio: navegación, animaciones, presentación, etapas, cronograma, gráficos y visor. */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const HOY = new Date();
  const fecha = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const corta = (s) => { const [, m, d] = s.split("-"); return `${d}/${m}`; };
  const DIA = 86400000;
  const INI = fecha("2026-08-20"), FIN = fecha("2026-12-10");
  const porWbs = (w) => TAREAS.find((t) => t[1] === w);

  /* ---------------- navegación ---------------- */
  function navegacion() {
    const nav = $("#nav"), barra = $("#progreso");
    const enlaces = $$("#menu a");
    const secciones = enlaces.map((a) => $(a.getAttribute("href")));
    const alDesplazar = () => {
      const h = document.documentElement;
      barra.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + "%";
      nav.classList.toggle("scrolled", h.scrollTop > 40);
      let activa = -1;
      secciones.forEach((s, i) => { if (s && s.getBoundingClientRect().top < 140) activa = i; });
      enlaces.forEach((a, i) => a.classList.toggle("active", i === activa));
    };
    addEventListener("scroll", alDesplazar, { passive: true });
    alDesplazar();
    const btn = $(".nav-toggle"), menu = $("#menu");
    btn.addEventListener("click", () => { const o = menu.classList.toggle("open"); btn.setAttribute("aria-expanded", o); });
    menu.addEventListener("click", (e) => { if (e.target.tagName === "A") { menu.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); } });
  }

  /* ---------------- aparición y contadores ---------------- */
  function animaciones() {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        $$(".count", e.target).forEach(contar);
        if (e.target.classList.contains("count")) contar(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    const dirs = ["up", "left", "right", "zoom", "up", "right", "left", "down"];
    $$(".reveal").forEach((el, i) => {
      if (!el.dataset.dir) el.dataset.dir = el.classList.contains("bleed") ? "up" : dirs[i % dirs.length];
      el.style.transitionDelay = (i % 3) * 90 + "ms";
      io.observe(el);
    });
    // números grandes de cada sección que se desplazan despacio con el scroll
    $$(".sec-head").forEach((h) => {
      const k = $(".kicker", h);
      const n = k && k.textContent.match(/^\s*(\d+)/);
      if (!n) return;
      const s = document.createElement("span");
      s.className = "big-num"; s.textContent = n[1]; s.setAttribute("aria-hidden", "true");
      s.dataset.speed = (0.12 + (+n[1] % 3) * 0.05).toFixed(2);
      h.prepend(s);
    });
    const liviano = matchMedia("(max-width: 900px), (hover: none)").matches;
    if (!reduce && !liviano) {
      let pend = false;
      const mover = () => {
        pend = false;
        const vh = innerHeight;
        $$(".big-num, [data-speed]").forEach((el) => {
          const r = el.parentElement.getBoundingClientRect();
          const d = (r.top + r.height / 2 - vh / 2) * +(el.dataset.speed || 0.1);
          el.style.transform = el.classList.contains("big-num") ? `translate(${d * 0.4}px, ${d}px)` : `translateY(${d}px)`;
        });
      };
      addEventListener("scroll", () => { if (!pend) { pend = true; requestAnimationFrame(mover); } }, { passive: true });
      mover();
    }
    function contar(el) {
      if (el.dataset.done) return;
      el.dataset.done = 1;
      const fin = +el.dataset.to;
      if (reduce) { el.textContent = fin.toLocaleString("es-PE"); return; }
      const t0 = performance.now(), dur = 1400;
      const paso = (t) => {
        const k = Math.min(1, (t - t0) / dur), v = Math.round(fin * (1 - Math.pow(1 - k, 3)));
        el.textContent = v.toLocaleString("es-PE");
        if (k < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    }
  }

  /* ---------------- estado del proyecto ---------------- */
  function fasesNivel2() { return TAREAS.filter((t) => t[3] === 2); }
  function estadoProyecto() {
    const pct = Math.max(0, Math.min(100, Math.round(((HOY - INI) / (FIN - INI)) * 100)));
    const actuales = fasesNivel2().filter((t) => fecha(t[4]) <= HOY && HOY <= fecha(t[5]) - 0 + DIA).map((t) => t[2]);
    let etiqueta = "En ejecución";
    if (HOY < INI) etiqueta = "Por iniciar";
    if (HOY > FIN) etiqueta = "Proyecto cerrado";
    $("#estado-proyecto").innerHTML = `
      <div class="st-top"><span class="st-dot"></span><b>${etiqueta}</b><span>Avance real 83 % · ${pct} % del plazo transcurrido</span></div>
      <div class="st-bar"><span style="width:83%"></span></div>
      <p>${actuales.length ? "Fases en curso hoy: " + actuales.join(" · ") : "Línea base: 20/08/2026 → 10/12/2026"} · corte ProjectLibre al 20/11/2026</p>`;
  }

  /* ---------------- presentación ---------------- */
  function presentacion() {
    const deck = $("#deck"), stage = $("#deck-stage"), slides = $$(".slide", stage);
    const dots = $("#dk-dots");
    let i = 0;
    slides.forEach((_, k) => {
      const b = document.createElement("button");
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", "Diapositiva " + (k + 1));
      b.addEventListener("click", () => ir(k));
      dots.appendChild(b);
    });
    function ir(k) {
      i = (k + slides.length) % slides.length;
      stage.style.transform = `translateX(-${i * 100}%)`;
      slides.forEach((s, n) => { s.classList.toggle("on", n === i); s.setAttribute("aria-hidden", n !== i); });
      $$("button", dots).forEach((b, n) => b.setAttribute("aria-selected", n === i));
      $("#dk-count").textContent = `${i + 1} / ${slides.length}`;
    }
    $("#dk-prev").addEventListener("click", () => ir(i - 1));
    $("#dk-next").addEventListener("click", () => ir(i + 1));
    deck.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { ir(i + 1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { ir(i - 1); e.preventDefault(); }
    });
    let x0 = null;
    stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) ir(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    $("#dk-full").addEventListener("click", () => pantallaCompleta(deck));
    ir(0);
  }

  function pantallaCompleta(el) {
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }

  /* ---------------- etapas ---------------- */
  const ETAPAS = [
    { n: "Inicio", w: "1.1", ini: "2026-08-20", fin: "2026-09-01", ent: ["Entrevistas con el patrocinador", "Acta de constitución", "Registro de interesados", "Hito: acta firmada (31/08)"] },
    { n: "Planificación", w: "1.2", ini: "2026-09-01", fin: "2026-09-17", ent: ["Lista de requerimientos (9 RF, 6 RNF)", "Plan de gestión del alcance", "EDT / WBS y cronograma", "Costos y presupuesto", "Plan de riesgos y comunicaciones", "En paralelo: análisis AS-IS / TO-BE y reglas BOM"] },
    { n: "Ejecución", w: "1.3", ini: "2026-09-18", fin: "2026-11-04", ent: ["Reuniones de coordinación semanales", "Asignación y supervisión de tareas", "Diseño de la BD de despiece y Kardex", "Construcción de los módulos del ERP", "Desarrollo de entregables de gestión"] },
    { n: "Monitoreo y control", w: "1.4", ini: "2026-11-05", fin: "2026-11-25", ent: ["Control de avance con valor ganado", "Control de solicitudes de cambio (SC-01 y SC-02)", "Pruebas de balance del Kardex y corrección de errores", "Validación y aceptación de entregables"] },
    { n: "Cierre", w: "1.5", ini: "2026-11-26", fin: "2026-12-10", ent: ["Informe final del proyecto", "Lecciones aprendidas", "Despliegue, manual y capacitación", "Cierre administrativo y firma", "Validación final con el patrocinador", "Hito: cierre del proyecto (10/12)"] },
  ];
  const avance = (e) => porWbs(e.w)[8];
  function estadoDe(e) {
    const a = avance(e);
    if (a >= 100) return ["done", "Completada"];
    if (a > 0 || HOY >= fecha(e.ini)) return ["now", `En curso · ${a} %`];
    return ["next", "Pendiente"];
  }
  function etapas() {
    const cont = $("#stages");
    cont.innerHTML = ETAPAS.map((e, k) => {
      const [c, t] = estadoDe(e);
      const dur = Math.round((fecha(e.fin) - fecha(e.ini)) / DIA) + 1;
      const av = avance(e);
      return `<button class="stage ${c}" role="tab" aria-selected="false" data-k="${k}">
        <span class="sg-num">${k + 1}</span><b>${e.n}</b><small>${corta(e.ini)} – ${corta(e.fin)} · ${dur} días</small>
        <span class="sg-state">${t}</span><span class="sg-bar"><i style="width:${av}%"></i></span></button>`;
    }).join("");
    const elegir = (k) => {
      $$(".stage", cont).forEach((b, n) => b.setAttribute("aria-selected", n === k));
      const e = ETAPAS[k], [c, t] = estadoDe(e);
      $("#stage-detail").innerHTML = `<div class="sd-head"><span class="sd-state ${c}">${t}</span><h3>${e.n}</h3><span>${corta(e.ini)}/2026 – ${corta(e.fin)}/2026</span></div>
        <ul>${e.ent.map((x) => `<li>${x}</li>`).join("")}</ul>`;
    };
    cont.addEventListener("click", (ev) => { const b = ev.target.closest(".stage"); if (b) elegir(+b.dataset.k); });
    const actual = ETAPAS.findIndex((e) => estadoDe(e)[0] === "now");
    elegir(actual >= 0 ? actual : ETAPAS.length - 1);
  }

  /* ---------------- pestañas de planes ---------------- */
  function planes() {
    const btns = $$(".plan-tabs [role=tab]");
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((o) => { o.setAttribute("aria-selected", o === b); $("#" + o.dataset.p).hidden = o !== b; });
    }));
  }

  /* ---------------- cronograma (Gantt) ---------------- */
  function gantt() {
    const cont = $("#gantt");
    const t0 = fecha("2026-08-17"), t1 = fecha("2026-12-21");
    const total = (t1 - t0) / DIA;
    const pos = (d) => (((fecha(d) - t0) / DIA) / total) * 100;
    const ancho = (a, b) => Math.max(0.6, ((fecha(b) - fecha(a)) / DIA + 1) / total * 100);
    const meses = [["Ago", "2026-08-17"], ["Set", "2026-09-01"], ["Oct", "2026-10-01"], ["Nov", "2026-11-01"], ["Dic", "2026-12-01"]];
    const porId = Object.fromEntries(TAREAS.map((t) => [t[0], t]));
    const padre = {};
    const pila = [];
    TAREAS.forEach((t) => {
      while (pila.length && pila[pila.length - 1][3] >= t[3]) pila.pop();
      padre[t[0]] = pila.length ? pila[pila.length - 1][0] : null;
      pila.push(t);
    });
    const tieneHijos = new Set(Object.values(padre).filter(Boolean));
    const rama = (id) => { let r = id; while (padre[r]) r = padre[r]; return porId[r][1] === "2" ? "dev" : "pm"; };
    let html = `<div class="gt-inner"><div class="gt-head"><div class="gt-name">Tarea</div><div class="gt-time">${meses.map(([m, d]) => `<span style="left:${pos(d)}%">${m}</span>`).join("")}</div></div><div class="gt-body">`;
    TAREAS.forEach((t) => {
      const [id, wbs, n, lvl, a, b, hito, pred, pc] = t;
      const resumen = tieneHijos.has(id);
      const preds = pred.map((p) => porId[p][1] + " " + porId[p][2]).join(", ");
      const tip = `${wbs} ${n}\n${corta(a)} → ${corta(b)} · avance ${pc} %${preds ? "\nDepende de: " + preds : ""}`;
      const est = pc >= 100 ? "hecha" : pc > 0 ? "curso" : "";
      html += `<div class="gt-row lvl${lvl} ${resumen ? "sum" : ""}" data-id="${id}" data-padre="${padre[id] || ""}">
        <div class="gt-name">${resumen ? `<button class="gt-tog" aria-expanded="true" aria-label="Contraer ${n}">▾</button>` : "<span class='gt-sp'></span>"}<span class="gt-wbs">${wbs}</span><span class="gt-n">${n}</span></div>
        <div class="gt-time">${hito ? `<span class="gt-ms" style="left:${pos(a)}%" title="${tip}"></span><span class="gt-mslbl" style="left:${pos(a)}%">${corta(a)}</span>`
          : `<span class="gt-bar ${rama(id)} ${resumen ? "sumbar" : ""} ${est}" style="left:${pos(a)}%;width:${ancho(a, b)}%" title="${tip}">${resumen ? "" : `<i style="width:${pc}%"></i>`}</span>${resumen ? "" : `<span class="gt-pc" style="left:calc(${pos(a) + ancho(a, b)}% + 4px)">${pc}%</span>`}`}</div></div>`;
    });
    html += `</div><span class="gt-today" style="left:calc(var(--gt-name) + (100% - var(--gt-name)) * ${pos(HOY.toISOString().slice(0, 10)) / 100})" title="Hoy"></span></div>`;
    cont.innerHTML = html;
    if (HOY < t0 || HOY > t1) $(".gt-today", cont).remove();

    const filas = $$(".gt-row", cont);
    const ocultarDesc = (id, ocultar) => filas.filter((r) => r.dataset.padre === String(id)).forEach((r) => {
      r.hidden = ocultar;
      if (r.classList.contains("sum")) {
        const abierto = $(".gt-tog", r).getAttribute("aria-expanded") === "true";
        ocultarDesc(r.dataset.id, ocultar || !abierto);
      }
    });
    cont.addEventListener("click", (e) => {
      const b = e.target.closest(".gt-tog");
      if (!b) return;
      const abierto = b.getAttribute("aria-expanded") === "true";
      b.setAttribute("aria-expanded", !abierto);
      b.textContent = abierto ? "▸" : "▾";
      ocultarDesc(b.closest(".gt-row").dataset.id, abierto);
    });
    const todos = (abrir) => {
      filas.forEach((r) => {
        const tg = $(".gt-tog", r);
        if (tg && r.classList.contains("lvl2")) { tg.setAttribute("aria-expanded", abrir); tg.textContent = abrir ? "▾" : "▸"; }
        if (tg && !r.classList.contains("lvl2")) { tg.setAttribute("aria-expanded", "true"); tg.textContent = "▾"; }
        r.hidden = !abrir && r.classList.contains("lvl3");
      });
    };
    $("#g-expand").addEventListener("click", () => todos(true));
    $("#g-collapse").addEventListener("click", () => todos(false));
  }

  /* ---------------- curva S, riesgos y EVM ---------------- */
  function curvaS() {
    const datos = [["Ago", 3230], ["Set", 11775], ["Oct", 20435.67], ["Nov", 30269], ["Dic", 32925]];
    const W = 540, H = 290, m = { l: 62, r: 20, t: 24, b: 34 }, MAX = 36000;
    const x = (i) => m.l + (i * (W - m.l - m.r)) / (datos.length - 1);
    const y = (v) => H - m.b - (v / MAX) * (H - m.t - m.b);
    const sol = (v) => "S/ " + v.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Curva S: costo planificado acumulado de S/ 3,230 en agosto a S/ 32,925 en diciembre; al 20/11 el valor ganado es S/ 26,876 y el costo real S/ 27,420"><defs><linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a4262c" stop-opacity=".22"/><stop offset="1" stop-color="#a4262c" stop-opacity="0"/></linearGradient></defs>`;
    [0, 9000, 18000, 27000, 36000].forEach((v) => { s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#e2e0dc"/><text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#64748b">${(v / 1000).toLocaleString("es-PE")} mil</text>`; });
    const pts = datos.map((d, i) => `${x(i)},${y(d[1])}`).join(" ");
    s += `<polygon points="${x(0)},${y(0)} ${pts} ${x(4)},${y(0)}" fill="url(#gS)"/>`;
    s += `<polyline class="draw" points="${pts}" fill="none" stroke="#a4262c" stroke-width="3" stroke-linejoin="round"/>`;
    datos.forEach((d, i) => {
      s += `<circle cx="${x(i)}" cy="${y(d[1])}" r="5" fill="#fff" stroke="#a4262c" stroke-width="2.5"><title>${d[0]} 2026 · PV acumulado: ${sol(d[1])}</title></circle><text x="${x(i)}" y="${H - 12}" text-anchor="middle" font-size="12" fill="#64748b">${d[0]}</text>`;
    });
    const xc = x(2 + 20 / 30);
    s += `<line x1="${xc}" x2="${xc}" y1="${m.t}" y2="${H - m.b}" stroke="#a4262c" stroke-dasharray="4 4" stroke-opacity=".5"/><text x="${xc - 6}" y="${m.t + 10}" text-anchor="end" font-size="11" fill="#a4262c">Corte 20/11</text>`;
    s += `<circle cx="${xc}" cy="${y(26876.25)}" r="6" fill="#2f7d4f"><title>EV al 20/11: ${sol(26876.25)}</title></circle><circle cx="${xc}" cy="${y(27420)}" r="6" fill="#c2410c"><title>AC al 20/11: ${sol(27420)}</title></circle>`;
    s += `<text x="${xc + 10}" y="${y(26876.25) + 16}" font-size="11" fill="#2f7d4f">EV 26.9 mil</text><text x="${xc + 10}" y="${y(27420) - 6}" font-size="11" fill="#c2410c">AC 27.4 mil</text>`;
    s += `<text x="${x(4) - 8}" y="${y(32925) - 10}" text-anchor="end" font-size="12" font-weight="700" fill="#1e293b">BAC S/ 32,925</text>`;
    $("#curva").innerHTML = s + "</svg>";
  }

  function mapaRiesgos() {
    const R = [["R-01", 4, 4], ["R-02", 3, 5], ["R-03", 3, 5], ["R-04", 3, 3], ["R-05", 3, 3], ["R-06", 3, 4], ["R-07", 2, 4], ["R-08", 2, 4], ["R-09", 2, 5], ["R-10", 2, 5], ["R-11", 3, 5]];
    let h = "";
    for (let p = 5; p >= 1; p--) {
      h += `<div class="lbl">${p}</div>`;
      for (let i = 1; i <= 5; i++) {
        const e = p * i, c = e >= 15 ? "c3" : e >= 8 ? "c2" : "c1";
        h += `<div class="cell ${c}">${R.filter((r) => r[1] === p && r[2] === i).map((r) => `<span class="r">${r[0]}</span>`).join("")}</div>`;
      }
    }
    h += `<div></div>` + [1, 2, 3, 4, 5].map((i) => `<div class="lbl">${i}</div>`).join("");
    $("#heat").innerHTML = h;
  }

  function evm() {
    const pct = 26876.25 / 32925, r = 70, c = 2 * Math.PI * r;
    $("#evm-gauge").innerHTML = `<svg viewBox="0 0 180 180" role="img" aria-label="Valor ganado al 20/11: 82 % del presupuesto hasta la conclusión (BAC)">
      <circle cx="90" cy="90" r="${r}" fill="none" stroke="#ead6d7" stroke-width="16"/>
      <circle class="ring" cx="90" cy="90" r="${r}" fill="none" stroke="#a4262c" stroke-width="16" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" style="--off:${c * (1 - pct)}" transform="rotate(-90 90 90)"/>
      <text x="90" y="88" text-anchor="middle" font-size="34" font-weight="800" fill="#1e293b" font-family="Segoe UI, Inter, sans-serif">82%</text>
      <text x="90" y="112" text-anchor="middle" font-size="12" fill="#64748b">EV / BAC</text></svg>`;
  }

  /* ---------------- zoom de imágenes y lightbox ---------------- */
  function zoom() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-zoom]");
      if (b) {
        const img = document.getElementById(b.dataset.target);
        const z = Math.min(3, Math.max(0.5, (+img.dataset.z || 1) + 0.25 * +b.dataset.zoom));
        img.dataset.z = z;
        img.style.width = 1600 * z + "px";
      }
      const lb = e.target.closest("[data-lightbox]");
      if (lb) abrirLightbox(`<img src="${lb.dataset.lightbox}" alt="">`);
    });
    $("#lb-close").addEventListener("click", cerrarLightbox);
    $("#lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox") cerrarLightbox(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarLightbox(); });
  }
  function abrirLightbox(html) { $("#lb-body").innerHTML = html; $("#lightbox").hidden = false; document.body.style.overflow = "hidden"; $("#lb-close").focus(); }
  function cerrarLightbox() { if ($("#lightbox").hidden) return; $("#lightbox").hidden = true; $("#lb-body").innerHTML = ""; document.body.style.overflow = ""; }

  /* ---------------- visor de documentos ---------------- */
  const DOCS = {
    informe: { t: "Informe final", f: "assets/docs/LRPD V.Final - Gestion de Proyecto.pdf", pdf: true },
    acta: { t: "Acta de constitución del proyecto", f: "assets/docs/Acta_Constitucion.pdf", hojas: "acta", n: 5 },
    edt: { t: "EDT / WBS", f: "assets/docs/EDT_Grupo03_Tarde.drawio", img: "assets/img/edt.png", w: 1800, oscuro: true },
    crono: { t: "Cronograma de actividades con avance al 20/11/2026", f: "assets/docs/Cronograma_Actividades_LRPDV3.pod", img: "assets/img/gantt.png", w: 1100 },
    costeo: { t: "Costeo del proyecto", f: "assets/docs/CND_Costeo_del_Proyecto.pdf", hojas: "costeo", n: 3 },
    ptr: { t: "Presupuesto por fase y tipo de recurso", f: "assets/docs/CND_Presupuesto_Fase_Tipo_Recurso.pdf", hojas: "ptr", n: 1 },
    pfe: { t: "Presupuesto por fase y entregable", f: "assets/docs/CND_Presupuesto_Fase_Y_Entregable.pdf", hojas: "pfe", n: 1 },
    reunion: { t: "Acta de reunión del 15/11/2026", f: "assets/docs/Acta_de_Reunion_15-11-2026.pdf", hojas: "reunion", n: 2 },
    leccion: { t: "Lección aprendida N.º 01", f: "assets/docs/Leccion_Aprendida_01_Control_Solicitudes_Cambio.pdf", hojas: "leccion", n: 3 },
  };
  function visor() {
    const frame = $("#viewer-frame");
    const pdf = (f) => (f = encodeURI(f), `<object data="${f}#view=FitH" type="application/pdf" class="pdf"><div class="pdf-fallback"><p>Tu navegador no muestra PDF dentro de la página.</p><a class="btn btn-primary" href="${f}" target="_blank" rel="noopener">Abrir el PDF</a></div></object>`);
    const render = (k) => {
      const d = DOCS[k];
      $("#doc-title").textContent = d.t;
      $("#doc-dl").href = encodeURI(d.f); $("#doc-dl").setAttribute("download", d.f.split("/").pop());
      if (d.hojas) {
        const nom = (i) => (d.nombres ? d.nombres[i - 1] : "Hoja " + i);
        const ns = Array.from({ length: d.n }, (_, i) => i + 1);
        frame.innerHTML = `<div class="acta"><div class="acta-thumbs">${ns.map((n) => `<button data-n="${n}" aria-label="${nom(n)}" ${n === 1 ? 'aria-current="true"' : ""}><img src="assets/img/hojas/${d.hojas}-${n}-t.jpg" alt=""><span>${nom(n)}</span></button>`).join("")}</div>
          <div class="acta-page"><img id="acta-img" src="assets/img/hojas/${d.hojas}-1.jpg" alt="${d.t}, ${nom(1)}"></div></div>`;
        frame.querySelector(".acta-thumbs").addEventListener("click", (e) => {
          const b = e.target.closest("button"); if (!b) return;
          $$(".acta-thumbs button", frame).forEach((o) => o.removeAttribute("aria-current"));
          b.setAttribute("aria-current", "true");
          const img = $("#acta-img"); img.src = `assets/img/hojas/${d.hojas}-${b.dataset.n}.jpg`; img.alt = `${d.t}, ${nom(+b.dataset.n)}`;
        });
      } else if (d.img) {
        frame.innerHTML = `<div class="pan ${d.oscuro ? "" : "light-pan"}"><img src="${d.img}" alt="${d.t}" style="width:${d.w}px"></div>`;
      } else {
        frame.innerHTML = pdf(d.f);
      }
    };
    const btns = $$(".viewer-tabs [role=tab]");
    const abrir = (k) => { btns.forEach((o) => o.setAttribute("aria-selected", o.dataset.doc === k)); render(k); };
    btns.forEach((b) => b.addEventListener("click", () => abrir(b.dataset.doc)));
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-doc-open]");
      if (!b) return;
      abrir(b.dataset.docOpen);
      $("#documentos").scrollIntoView({ behavior: "smooth" });
    });
    $("#doc-full").addEventListener("click", () => pantallaCompleta($(".viewer-body")));
    // en celulares el PDF no se incrusta: se abre primero un documento con hojas en imagen
    abrir(matchMedia("(max-width: 900px), (hover: none)").matches ? "acta" : "informe");
  }

  document.addEventListener("DOMContentLoaded", () => {
    navegacion();
    estadoProyecto();
    presentacion();
    etapas();
    planes();
    gantt();
    curvaS();
    mapaRiesgos();
    evm();
    zoom();
    visor();
    animaciones();
  });
})();
