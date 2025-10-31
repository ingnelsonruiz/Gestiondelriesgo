// src/lib/certificado-pdf.ts

import type { Content } from 'pdfmake/interfaces';

export interface CertificadoData {
  providerName: string;
  module: 'Gestantes' | 'RCV' | 'Fenix';
  fileName: string;
  timestamp: Date;
}

export interface PdfImages {
  background: string;
}

function buildDocDefinition(data: CertificadoData, images: PdfImages): any {
  const { providerName, module, fileName, timestamp } = data;
  const formattedDate = timestamp.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = timestamp.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const content: Content = [
    {
      text: 'Certificado de Cargue Exitoso',
      style: 'header',
      alignment: 'center',
      margin: [0, 80, 0, 20],
    },
    {
      text: 'Se certifica que el archivo de datos ha sido recibido y procesado exitosamente en la plataforma de Gestión del Riesgo.',
      style: 'body',
      alignment: 'center',
      margin: [20, 0, 20, 40],
    },
    {
      canvas: [{ type: 'line', x1: 40, y1: 5, x2: 485, y2: 5, lineWidth: 0.5, lineColor: '#cccccc' }],
      margin: [0, 0, 0, 20],
    },
    {
      style: 'tableStyle',
      table: {
        widths: ['auto', '*'],
        body: [
          [{ text: 'Prestador:', style: 'tableLabel' }, { text: providerName, style: 'tableValue' }],
          [{ text: 'Módulo:', style: 'tableLabel' }, { text: module, style: 'tableValue' }],
          [{ text: 'Nombre del Archivo:', style: 'tableLabel' }, { text: fileName, style: 'tableValue' }],
          [{ text: 'Fecha de Cargue:', style: 'tableLabel' }, { text: formattedDate, style: 'tableValue' }],
          [{ text: 'Hora de Cargue:', style: 'tableLabel' }, { text: formattedTime, style: 'tableValue' }],
        ],
      },
      layout: 'noBorders',
    },
    {
      canvas: [{ type: 'line', x1: 40, y1: 5, x2: 485, y2: 5, lineWidth: 0.5, lineColor: '#cccccc' }],
      margin: [0, 20, 0, 0],
    },
    {
      text: 'Generado automáticamente por la Plataforma de Gestión del Riesgo - FENIX.',
      style: 'footer',
      alignment: 'center',
      margin: [0, 60, 0, 0],
    },
  ];

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    background: function() {
        return {
            image: images.background,
            width: 595, // Ancho de A4 en puntos
            height: 842, // Alto de A4 en puntos
            absolutePosition: { x: 0, y: 0 },
            opacity: 1
        };
    },
    content: content,
    styles: {
      header: {
        fontSize: 28,
        bold: true,
        color: '#003366', // Azul oscuro
        font: 'Roboto',
      },
      body: {
        fontSize: 12,
        lineHeight: 1.5,
        color: '#333333',
      },
      tableStyle: {
        margin: [40, 20, 40, 20],
      },
      tableLabel: {
        bold: true,
        fontSize: 12,
        color: '#003366',
        margin: [0, 0, 10, 10]
      },
      tableValue: {
        fontSize: 12,
        color: '#333333',
         margin: [0, 0, 0, 10]
      },
      footer: {
        fontSize: 9,
        italics: true,
        color: '#aaaaaa',
      },
    },
    defaultStyle: {
      font: 'Roboto'
    }
  };

  return docDefinition;
}

export async function descargarCertificadoCargue(
  data: CertificadoData,
  images: PdfImages
) {
  // Import dinámico para evitar problemas de SSR en Next/Firebase Studio
  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;

  // Asignación correcta y segura de las fuentes (vfs)
  // Esta es la corrección definitiva.
  if (pdfMake && pdfFonts) {
    (pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
  }

  const docDef = buildDocDefinition(data, images);
  const fileName = `Certificado_${data.module}_${data.providerName.replace(/\s+/g, '_')}.pdf`;
  pdfMake.createPdf(docDef).download(fileName);
}
