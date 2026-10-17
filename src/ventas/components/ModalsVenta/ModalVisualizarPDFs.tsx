'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { FaTimes, FaFileInvoice, FaFileContract } from 'react-icons/fa';
import { descargarPdfBase64 } from '../../../utils/descargarPdf';

interface ModalVisualizarPDFsProps {
  isOpen: boolean;
  onClose: () => void;
  facturaPDF: string | null;
  pagarePDF: string | null;
}

const ModalVisualizarPDFs: React.FC<ModalVisualizarPDFsProps> = ({
  isOpen,
  onClose,
  facturaPDF,
  pagarePDF,
}) => {
  // Convertir base64 a URL para iframe
  const createPDFUrl = (base64: string) => {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error al crear URL del PDF:', error);
      return null;
    }
  };

  const facturaUrl = facturaPDF ? createPDFUrl(facturaPDF) : null;
  const pagareUrl = pagarePDF ? createPDFUrl(pagarePDF) : null;

  const handleDownload = (base64: string, filename: string) => {
    descargarPdfBase64(base64, filename);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-xl font-bold text-white flex items-center gap-2">
                      <FaFileInvoice className="text-2xl" />
                      Comprobantes Generados
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <FaTimes size={24} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className={`grid ${pagarePDF ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
                    {/* Factura */}
                    {facturaUrl && (
                      <div className="flex flex-col">
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FaFileInvoice className="text-blue-600 text-xl" />
                            <h3 className="font-bold text-blue-900">Factura / Ticket</h3>
                          </div>
                          {facturaPDF && (
                            <button
                              onClick={() => handleDownload(facturaPDF, 'factura.pdf')}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                              Descargar
                            </button>
                          )}
                        </div>
                        <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                          <iframe
                            src={facturaUrl}
                            className="w-full h-[600px]"
                            title="Factura PDF"
                          />
                        </div>
                      </div>
                    )}

                    {/* Pagaré */}
                    {pagareUrl && (
                      <div className="flex flex-col">
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FaFileContract className="text-green-600 text-xl" />
                            <h3 className="font-bold text-green-900">Pagaré</h3>
                          </div>
                          {pagarePDF && (
                            <button
                              onClick={() => handleDownload(pagarePDF, 'pagare.pdf')}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                              Descargar
                            </button>
                          )}
                        </div>
                        <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                          <iframe
                            src={pagareUrl}
                            className="w-full h-[600px]"
                            title="Pagaré PDF"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={onClose}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalVisualizarPDFs;
