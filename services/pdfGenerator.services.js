import PDFDocument from 'pdfkit';

export async function generatePDF(formResponses, device) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      let pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // Generar el contenido del PDF
    doc.fontSize(18).text(`Mantenimiento - ${device.nombre}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Ubicación: ${device.ubicacion}`);
    doc.fontSize(14).text(`Categoría: ${device.categoria}`);
    doc.moveDown();

    formResponses.forEach(response => {
      doc.fontSize(12).text(`${response.question}: ${response.answer}`);
    });

    doc.end();
  });
}