/**
 * Descargar un PDF que el backend devuelve en base64.
 *
 * Reemplaza el patrón que estaba repetido por todo el proyecto:
 *
 *   const link = document.createElement("a");
 *   link.href = `data:application/pdf;base64,${base64}`;
 *   link.download = "Reporte.pdf";
 *   link.click();
 *
 * Ese patrón tenía dos problemas reales:
 *
 *  1. El <a> nunca se agregaba al documento. Chrome ignora el atributo
 *     `download` en un elemento desconectado del DOM, así que el archivo se
 *     guardaba con un UUID y SIN extensión (por ejemplo
 *     "dbe3742a-4525-4603-95c3-faa8399193f8"). Al usuario le llegaba un archivo
 *     sin nombre ni tipo, que Windows y los antivirus marcan como sospechoso.
 *
 *  2. Un data: URI incrusta el archivo entero en la URL. Para un PDF de ~135 KB
 *     eso son cientos de miles de caracteres en el href, algo que además dispara
 *     heurísticas de bloqueo en varios antivirus y navegadores.
 *
 * Con Blob + createObjectURL el navegador recibe binario real con su MIME type,
 * respeta el nombre del archivo y no hay URI gigante que analizar.
 */
export function descargarPdfBase64(base64: string, nombreArchivo: string): void {
  if (!base64) {
    throw new Error('El servidor no devolvió el contenido del PDF.');
  }

  // base64 -> bytes
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo.endsWith('.pdf') ? nombreArchivo : `${nombreArchivo}.pdf`;
  // Adjuntarlo al DOM es lo que hace que Chrome respete el nombre del archivo.
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Liberar la memoria del blob una vez que el navegador inició la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Fecha en formato YYYY-MM-DD para nombrar archivos.
 *
 * toLocaleDateString() devuelve "14/9/2026" en es-PY: las barras no son válidas
 * en nombres de archivo de Windows y el navegador las recorta o sustituye.
 */
export function fechaParaNombreArchivo(fecha: Date = new Date()): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
