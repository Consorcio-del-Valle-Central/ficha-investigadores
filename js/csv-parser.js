export function parseCSV(csvText) {
  const text = String(csvText).replace(/^\uFEFF/, '');

  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }

      continue;
    }

    if (char === '"') {
      if (field === '') {
        quoted = true;
      } else {
        throw new Error(
          `CSV inválido: comilla inesperada en el carácter ${i + 1}`
        );
      }

      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\r' || char === '\n') {
      row.push(field);
      field = '';

      if (row.some(valor => valor !== '')) {
        rows.push(row);
      }

      row = [];

      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }

      continue;
    }

    field += char;
  }

  if (quoted) {
    throw new Error('CSV inválido: hay una comilla sin cerrar');
  }

  if (field !== '' || row.length > 0) {
    row.push(field);

    if (row.some(valor => valor !== '')) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    throw new Error('El CSV está vacío');
  }

  const headers = rows[0].map(header =>
    header.replace(/^\uFEFF/, '').trim()
  );

  if (headers.length === 0 || headers.every(header => !header)) {
    throw new Error('El CSV no contiene encabezados');
  }

  return rows.slice(1).map((values, rowIndex) => {
    if (values.length !== headers.length) {
      throw new Error(
        `Fila CSV ${rowIndex + 2}: se encontraron ` +
        `${values.length} columnas, pero se esperaban ` +
        `${headers.length}`
      );
    }

    return Object.fromEntries(
      headers.map((header, columnIndex) => [
        header,
        values[columnIndex],
      ])
    );
  });
}