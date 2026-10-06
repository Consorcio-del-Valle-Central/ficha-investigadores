import { parseCSV } from './csv-parser.js';

const CAMPOS = {
  1: 'nombreCompleto',
  2: 'correoInstitucional',
  3: 'universidad',
  4: 'facultad',
  5: 'departamento',
  6: 'vinculoUniversidad',
  7: 'gradoAcademico',
  9: 'disciplinas',
  10: 'subdisciplina',
  11: 'palabrasClave',
  12: 'sellosProyecto',
  13: 'metodologias',
  14: 'experienciaInterTrans',
  15: 'trabajaActoresExternos',
  16: 'actoresExternos',
  17: 'aportesInterdisciplinarios',
  18: 'buscaCapacidades',
};

const GRUPOS = [
  {
    titulo: 'Institución',
    campos: [
      ['Universidad', 'universidad'],
      ['Facultad, instituto o unidad académica', 'facultad'],
      ['Departamento', 'departamento'],
      ['Vínculo con la universidad', 'vinculoUniversidad'],
      ['Grado académico máximo', 'gradoAcademico'],
    ],
  },
  {
    titulo: 'Investigación',
    campos: [
      ['Disciplinas principales', 'disciplinas'],
      ['Subdisciplina', 'subdisciplina'],
      ['Palabras clave', 'palabrasClave'],
      ['Sellos del proyecto', 'sellosProyecto'],
      ['Metodologías y capacidades', 'metodologias'],
    ],
  },
  {
    titulo: 'Colaboración',
    campos: [
      ['Experiencia interdisciplinaria o transdisciplinaria', 'experienciaInterTrans'],
      ['Trabajo con actores externos', 'trabajaActoresExternos'],
      ['Actores externos', 'actoresExternos'],
      ['Aportes a un trabajo interdisciplinario', 'aportesInterdisciplinarios'],
      ['Conocimientos y capacidades que busca', 'buscaCapacidades'],
    ],
  },
];

const encabezado = document.getElementById('encabezado-directorio');
const estado = document.getElementById('estado');
const volverError = document.getElementById('volver-error');
const seccionLista = document.getElementById('seccion-lista');
const lista = document.getElementById('investigadores');
const plantilla = document.getElementById('plantilla-investigador');
const ficha = document.getElementById('ficha');
const contenidoFicha = document.getElementById('contenido');

function mostrarEstado(mensaje, mostrarVolver = false) {
  estado.textContent = mensaje;
  estado.hidden = false;
  volverError.hidden = !mostrarVolver;
}

function indiceColumnas(headers) {
  const columnas = new Map();
  for (const header of headers) {
    const match = header.replace(/^\uFEFF/, '').trim().match(/^(\d+)\s*\./);
    if (!match) continue;

    const numero = Number(match[1]);
    if (columnas.has(numero)) {
      throw new Error(`Encabezado duplicado: ${numero}`);
    }
    columnas.set(numero, header);
  }

  for (const numero of Object.keys(CAMPOS).map(Number)) {
    if (!columnas.has(numero)) {
      throw new Error(`Falta la pregunta ${numero} en el CSV`);
    }
  }
  if (!headers.includes('ID')) {
    throw new Error('El CSV no tiene una columna llamada "ID"');
  }
  if (headers[2] !== columnas.get(2)) {
    throw new Error('El correo (pregunta 2) no está en la tercera columna física');
  }

  return columnas;
}

function normalizarInvestigadores(filas, columnas) {
  const ids = new Set();

  return filas.map((fila, indice) => {
    const investigador = Object.fromEntries(
      Object.entries(CAMPOS).map(([numero, clave]) => [
        clave,
        (fila[columnas.get(Number(numero))] ?? '').trim(),
      ]),
    );
    investigador.id = (fila.ID ?? '').trim();

    if (!investigador.id || !investigador.nombreCompleto) {
      throw new Error(`Falta el ID o el nombre en la fila ${indice + 2} del CSV`);
    }
    if (ids.has(investigador.id)) {
      throw new Error(`El ID "${investigador.id}" aparece más de una vez en el CSV`);
    }
    ids.add(investigador.id);
    return investigador;
  });
}

function completarTexto(elemento, texto) {
  if (texto) {
    elemento.textContent = texto;
    elemento.hidden = false;
  } else {
    elemento.hidden = true;
  }
}

function crearElementoLista(investigador) {
  const elemento = plantilla.content.firstElementChild.cloneNode(true);
  const enlace = elemento.querySelector('.investigador-enlace');
  enlace.href = `?id=${encodeURIComponent(investigador.id)}`;
  elemento.querySelector('.investigador-nombre').textContent = investigador.nombreCompleto;
  completarTexto(
    elemento.querySelector('.investigador-institucion'),
    investigador.universidad,
  );
  completarTexto(
    elemento.querySelector('.investigador-facultad'),
    investigador.facultad,
  );
  completarTexto(
    elemento.querySelector('.investigador-disciplinas'),
    investigador.disciplinas,
  );
  return elemento;
}

function mostrarLista(investigadores) {
  const fragmento = document.createDocumentFragment();
  for (const investigador of investigadores) {
    fragmento.append(crearElementoLista(investigador));
  }
  lista.replaceChildren(fragmento);
  document.title = 'Directorio de investigadores';
  encabezado.hidden = false;
  seccionLista.hidden = false;
  ficha.hidden = true;
  estado.textContent = `${investigadores.length} investigadores`;
  estado.hidden = false;
  volverError.hidden = true;
}

function agregarGrupo(grupo, investigador) {
  const presentes = grupo.campos.filter(([, clave]) => investigador[clave]);
  if (!presentes.length) return;

  const section = document.createElement('section');
  section.className = 'grupo';
  const heading = document.createElement('h2');
  heading.textContent = grupo.titulo;
  section.append(heading);

  const dl = document.createElement('dl');
  for (const [etiqueta, clave] of presentes) {
    const item = document.createElement('div');
    item.className = 'dato';
    const dt = document.createElement('dt');
    dt.textContent = etiqueta;
    const dd = document.createElement('dd');
    dd.textContent = investigador[clave];
    item.append(dt, dd);
    dl.append(item);
  }
  section.append(dl);
  contenidoFicha.append(section);
}

function mostrarFicha(investigador) {
  document.title = `${investigador.nombreCompleto} · Ficha`;
  document.getElementById('nombre').textContent = investigador.nombreCompleto;
  const correo = document.getElementById('correo');
  completarTexto(correo, investigador.correoInstitucional);
  if (investigador.correoInstitucional) {
    correo.href = `mailto:${investigador.correoInstitucional}`;
  } else {
    correo.removeAttribute('href');
  }

  contenidoFicha.replaceChildren();
  for (const grupo of GRUPOS) agregarGrupo(grupo, investigador);
  encabezado.hidden = true;
  seccionLista.hidden = true;
  estado.hidden = true;
  volverError.hidden = true;
  ficha.hidden = false;
}

async function iniciar() {
  const parametros = new URLSearchParams(window.location.search);
  const mostrarDetalle = parametros.has('id');
  const id = parametros.get('id')?.trim();

  if (mostrarDetalle) {
    encabezado.hidden = true;
    seccionLista.hidden = true;
    if (!id) {
      mostrarEstado('El ID de investigador está vacío.', true);
      return;
    }
  }

  try {
    const csvUrl = new URL('../assets/researchers-list.csv', import.meta.url);
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`No se pudo cargar el CSV (HTTP ${response.status}): ${csvUrl.href}`);
    }

    const filas = parseCSV(await response.text());
    const columnas = indiceColumnas(Object.keys(filas[0] ?? {}));
    const investigadores = normalizarInvestigadores(filas, columnas);

    if (!mostrarDetalle) {
      mostrarLista(investigadores);
      return;
    }

    const investigador = investigadores.find(persona => persona.id === id);
    if (!investigador) {
      mostrarEstado('No se encontró una ficha para ese ID.', true);
      return;
    }
    mostrarFicha(investigador);
  } catch (error) {
    console.error(error);
    mostrarEstado(`No se pudo cargar la información: ${error.message}`, mostrarDetalle);
  }
}

iniciar();
