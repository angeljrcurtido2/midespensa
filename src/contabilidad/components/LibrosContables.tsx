import React, { useState } from 'react';
import {
  FaBook,
  FaFileInvoiceDollar,
  FaCashRegister,
  FaReceipt,
  FaShoppingCart,
  FaCalendarAlt,
  FaFileDownload,
  FaChartLine
} from 'react-icons/fa';
import {
  MdTrendingUp,
  MdAccountBalance
} from 'react-icons/md';
import {
  HiDocumentText
} from 'react-icons/hi';
import ModalSeleccionarFechas from '../../components/ModalSeleccionarFechas';
import ModalError from '../../components/ModalError';
import {
  generateLibroDiarioPDF,
  generateLibroMayorPDF
} from '../../services/contabilidad';
import {
  generateLibroVentasPDF
} from '../../services/ventas';
import {
  generateLibroComprasPDF
} from '../../services/compras';
import {
  generateLibroCajaPDF
} from '../../services/movimiento';
import { renderTitle } from '../../clientes/utils/utils';
import { descargarPdfBase64 } from '../../utils/descargarPdf';

interface LibroContable {
  id: string;
  titulo: string;
  descripcion: string;
  icon: React.ElementType;
  bgColor: string;
  accentColor: string;
  pattern: string;
  badge: string;
}

const LibrosContables: React.FC = () => {
  const [modalAbierto, setModalAbierto] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const libros: LibroContable[] = [
    {
      id: 'libro-diario',
      titulo: 'Libro Diario',
      descripcion: 'Registro cronológico de todos los asientos contables con partida doble',
      icon: FaBook,
      bgColor: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      accentColor: 'text-blue-600',
      pattern: 'diagonal-lines',
      badge: 'NIIF'
    },
    {
      id: 'libro-mayor',
      titulo: 'Libro Mayor',
      descripcion: 'Movimientos agrupados por cuenta contable y saldos acumulados',
      icon: FaFileInvoiceDollar,
      bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      accentColor: 'text-blue-600',
      pattern: 'dots',
      badge: 'NIIF'
    },
    {
      id: 'libro-caja',
      titulo: 'Libro de Caja',
      descripcion: 'Control diario de ingresos y egresos de efectivo',
      icon: FaCashRegister,
      bgColor: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      accentColor: 'text-blue-600',
      pattern: 'grid',
      badge: 'SET'
    },
    {
      id: 'libro-ventas',
      titulo: 'Libro de Ventas',
      descripcion: 'Registro de IVA débito fiscal para declaración mensual',
      icon: FaReceipt,
      bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      accentColor: 'text-blue-600',
      pattern: 'waves',
      badge: 'SET'
    },
    {
      id: 'libro-compras',
      titulo: 'Libro de Compras',
      descripcion: 'Registro de IVA crédito fiscal para declaración mensual',
      icon: FaShoppingCart,
      bgColor: 'bg-gradient-to-r from-blue-600 to-indigo-500',
      accentColor: 'text-blue-600',
      pattern: 'circles',
      badge: 'SET'
    }
  ];

  const handleGenerarLibro = async (libroId: string, fechaInicio: string, fechaFin: string) => {
    try {
      let res;
      let nombreArchivo = '';

      switch (libroId) {
        case 'libro-diario':
          console.log('📖 Generando Libro Diario...');
          res = await generateLibroDiarioPDF({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
          nombreArchivo = `Libro-Diario-${fechaInicio}-${fechaFin}.pdf`;
          break;

        case 'libro-mayor':
          console.log('Generando Libro Mayor...');
          res = await generateLibroMayorPDF({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
          nombreArchivo = `Libro-Mayor-${fechaInicio}-${fechaFin}.pdf`;
          break;

        case 'libro-caja':
          console.log('Generando Libro de Caja...');
          res = await generateLibroCajaPDF({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
          nombreArchivo = `Libro-Caja-${fechaInicio}-${fechaFin}.pdf`;
          break;

        case 'libro-ventas':
          console.log('🧾 Generando Libro de Ventas...');
          res = await generateLibroVentasPDF({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
          nombreArchivo = `Libro-Ventas-${fechaInicio}-${fechaFin}.pdf`;
          break;

        case 'libro-compras':
          console.log('📦 Generando Libro de Compras...');
          res = await generateLibroComprasPDF({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
          nombreArchivo = `Libro-Compras-${fechaInicio}-${fechaFin}.pdf`;
          break;

        default:
          throw new Error('Libro no reconocido');
      }

      if (res && res.data.reportePDFBase64) {
        descargarPdfBase64(res.data.reportePDFBase64, nombreArchivo);
        console.log(`  ${nombreArchivo} descargado exitosamente`);
      }
    } catch (error) {
      console.error(`  Error al generar libro:`, error);
      setErrorMessage(`  Error al generar el libro. Por favor, intente nuevamente.`);
    }
  };

 return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarGutter: 'stable' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {renderTitle ({title:"Libros Contables", subtitle:"Sistema integrado de reportería contable y fiscal", icon:<MdAccountBalance className="text-white text-3xl sm:text-4xl" />})}
        {/* Stats rápidos */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700">
            <FaChartLine className="text-blue-500 dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">5 Libros Disponibles</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700">
            <FaCalendarAlt className="text-blue-500 dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Períodos Personalizables</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700">
            <FaFileDownload className="text-blue-500 dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Descarga PDF</span>
          </div>
        </div>

        {/* Grid de Cards con diseño único */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {libros.map((libro, index) => {
            const Icon = libro.icon;

            return (
              <div
                key={libro.id}
                className="group relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Card con glassmorphism */}
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer border border-white/50 dark:border-gray-700/50">

                  {/* Badge flotante */}
                  <div className="absolute top-4 right-4 z-10">
                    <div className="px-3 py-1 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-700 dark:text-gray-300 shadow-lg flex items-center gap-1">
                      <HiDocumentText className="w-3 h-3" />
                      {libro.badge}
                    </div>
                  </div>

                  {/* Header con gradiente y patrón */}
                  <div className={`relative ${libro.bgColor} dark:from-gray-700 dark:to-gray-800 p-8 overflow-hidden`}>
                    {/* Patrón decorativo */}
                    <div className="absolute inset-0 opacity-20 dark:opacity-10">
                      <div className="absolute inset-0" style={{
                        backgroundImage: libro.pattern === 'dots' ? 'radial-gradient(circle, white 1px, transparent 1px)' :
                                        libro.pattern === 'grid' ? 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)' :
                                        libro.pattern === 'diagonal-lines' ? 'repeating-linear-gradient(45deg, white, white 2px, transparent 2px, transparent 10px)' :
                                        libro.pattern === 'waves' ? 'radial-gradient(ellipse at top, white, transparent)' :
                                        'radial-gradient(circle, white 2px, transparent 2px)',
                        backgroundSize: libro.pattern === 'grid' ? '20px 20px' : '20px 20px'
                      }}></div>
                    </div>

                    <div className="relative flex items-center justify-between">
                      <div className="p-4 bg-white/20 dark:bg-gray-600/30 backdrop-blur-sm rounded-2xl">
                        <Icon className="w-10 h-10 text-white drop-shadow-lg" />
                      </div>
                      <MdTrendingUp className="w-6 h-6 text-white/70 group-hover:scale-110 transition-transform" />
                    </div>

                    <h3 className="text-2xl font-bold text-white mt-6 drop-shadow-md">
                      {libro.titulo}
                    </h3>
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6 min-h-[60px]">
                      {libro.descripcion}
                    </p>

                    {/* Botón de acción */}
                    <button
                      onClick={() => setModalAbierto(libro.id)}
                      className="group w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-between shadow-md hover:shadow-lg"
                    >
                      <span className="flex items-center gap-2">
                        <FaFileDownload className="group-hover:animate-bounce" />
                        Generar Reporte
                      </span>
                      <div className="w-8 h-8 bg-white/20 dark:bg-gray-600/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-lg">→</span>
                      </div>
                    </button>
                  </div>

                  {/* Efecto hover brillo */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/0 via-white/5 to-white/0 dark:from-white/0 dark:via-white/3 dark:to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel informativo con diseño moderno */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Libros NIIF */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-700 dark:to-indigo-700 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-blue-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 rounded-xl">
                  <FaBook className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Libros Contables NIIF</h3>
              </div>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mt-1.5"></div>
                  <div>
                    <strong className="text-gray-800 dark:text-white">Libro Diario:</strong> Registro cronológico de asientos con partida doble
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full mt-1.5"></div>
                  <div>
                    <strong className="text-gray-800 dark:text-white">Libro Mayor:</strong> Saldos y movimientos por cuenta contable
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Libros SET */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-700 dark:to-indigo-700 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-blue-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-700 dark:to-gray-800 rounded-xl">
                  <FaReceipt className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Libros Obligatorios SET</h3>
              </div>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mt-1.5"></div>
                  <div>
                    <strong className="text-gray-800 dark:text-white">Libro de Caja:</strong> Control diario de efectivo
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-1.5"></div>
                  <div>
                    <strong className="text-gray-800 dark:text-white">Libro de Ventas:</strong> IVA débito fiscal mensual
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full mt-1.5"></div>
                  <div>
                    <strong className="text-gray-800 dark:text-white">Libro de Compras:</strong> IVA crédito fiscal mensual
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales de Selección de Fechas */}
      {libros.map((libro) => (
        <ModalSeleccionarFechas
          key={`modal-${libro.id}`}
          isOpen={modalAbierto === libro.id}
          onClose={() => setModalAbierto(null)}
          onGenerar={(fechaInicio, fechaFin) => {
            handleGenerarLibro(libro.id, fechaInicio, fechaFin);
            setModalAbierto(null);
          }}
          titulo={libro.titulo}
          descripcion={`Selecciona el período para generar el ${libro.titulo}`}
        />
      ))}

      {/* Modal de Error */}
      <ModalError
        isOpen={!!errorMessage}
        onClose={() => setErrorMessage("")}
        message={errorMessage}
      />
    </div>
  );
};

export default LibrosContables;