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
    titulo: 'Institución', campos: [
      ['Universidad', 'universidad'],
      ['Facultad, instituto o unidad académica', 'facultad'],
      ['Departamento', 'departamento'],
      ['Vínculo con la universidad', 'vinculoUniversidad'],
      ['Grado académico máximo', 'gradoAcademico'],
    ]
  },
  {
    titulo: 'Investigación', campos: [
      ['Disciplinas principales', 'disciplinas'],
      ['Subdisciplina', 'subdisciplina'],
      ['Palabras clave', 'palabrasClave'],
      ['Sellos del proyecto', 'sellosProyecto'],
      ['Metodologías y capacidades', 'metodologias'],
    ]
  },
  {
    titulo: 'Colaboración', campos: [
      ['Experiencia interdisciplinaria o transdisciplinaria', 'experienciaInterTrans'],
      ['Trabajo con actores externos', 'trabajaActoresExternos'],
      ['Actores externos', 'actoresExternos'],
      ['Aportes a un trabajo interdisciplinario', 'aportesInterdisciplinarios'],
      ['Conocimientos y capacidades que busca', 'buscaCapacidades'],
    ]
  },
];

const estado = document.getElementById('estado');
const ficha = document.getElementById('ficha');

function mostrarEstado(mensaje) {
  estado.textContent = mensaje;
  estado.hidden = false;
  ficha.hidden = true;
}

function indiceColumnas(headers) {
  const columnas = new Map();
  for (const header of headers) {
    const match = header.replace(/^\uFEFF/, '').trim().match(/^(\d+)\s*\./);
    if (!match) continue;
    const numero = Number(match[1]);
    if (columnas.has(numero)) throw new Error(`Encabezado duplicado: ${numero}`);
    columnas.set(numero, header);
  }
  for (const numero of Object.keys(CAMPOS).map(Number)) {
    if (!columnas.has(numero)) throw new Error(`Falta la pregunta ${numero} en el CSV`);
  }
  if (headers[2] !== columnas.get(2)) {
    throw new Error('El correo (pregunta 2) no está en la tercera columna física');
  }
  return columnas;
}

function normalizarFila(fila, columnas) {
  const investigador = Object.fromEntries(
    Object.entries(CAMPOS).map(([numero, clave]) => [
      clave,
      (fila[columnas.get(Number(numero))] ?? '').trim(),
    ])
  );

  return {
    ...investigador,
    id: (fila.ID ?? '').trim(),
  };
}

function agregarGrupo(contenedor, grupo, investigador) {
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
  contenedor.append(section);
}

function mostrarFicha(investigador) {
  document.title = `${investigador.nombreCompleto || 'Investigador'} · Ficha`;
  document.getElementById('nombre').textContent = investigador.nombreCompleto;
  const correo = document.getElementById('correo');
  correo.textContent = investigador.correoInstitucional;
  correo.href = `mailto:${investigador.correoInstitucional}`;
  const contenido = document.getElementById('contenido');
  contenido.replaceChildren();
  for (const grupo of GRUPOS) agregarGrupo(contenido, grupo, investigador);
  estado.hidden = true;
  ficha.hidden = false;
}

async function iniciar() {
  const id = new URLSearchParams(window.location.search)
    .get('id')
    ?.trim();

  if (!id) {
    return mostrarEstado('Falta el ID en la URL de la ficha.');
  }

  try {
    const csvUrl = new URL('../assets/researchers-list.csv', import.meta.url);
    const response = await fetch(csvUrl);

    if (!response.ok) {
      throw new Error(
        `No se pudo cargar el CSV (HTTP ${response.status}): ${csvUrl.href}`
      );
    }

    const filas = parseCSV(await response.text());

    if (!filas.length) {
      throw new Error('El CSV no contiene investigadores');
    }

    if (!Object.hasOwn(filas[0], 'ID')) {
      throw new Error('El CSV no tiene una columna llamada "ID"');
    }

    const columnas = indiceColumnas(Object.keys(filas[0]));

    const coincidencias = filas
      .map(fila => normalizarFila(fila, columnas))
      .filter(investigador => investigador.id === id);

    if (!coincidencias.length) {
      return mostrarEstado('No se encontró una ficha para ese ID.');
    }

    if (coincidencias.length > 1) {
      throw new Error(`El ID "${id}" aparece más de una vez en el CSV`);
    }

    mostrarFicha(coincidencias[0]);
  } catch (error) {
    console.error(error);
    mostrarEstado(`No se pudo mostrar la ficha: ${error.message}`);
  }
}

iniciar();