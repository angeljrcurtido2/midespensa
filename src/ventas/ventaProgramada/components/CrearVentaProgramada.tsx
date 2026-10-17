'use client';

import { useState } from 'react';
import { createVentaProgramada } from '../../../services/ventas';
import ModalSeleccionarCliente from '../../components/ModalsVenta/ModalSeleccionarCliente';
import ModalSeleccionarProducto from '../../../compras/components/Modals/ModalSeleccionarProducto';
import ModalError from '../../../components/ModalError';
import ModalSuccess from '../../../components/ModalSuccess';

import {
  FaUser,           // Para 👤 (usuario/cliente)
  FaBox,            // Para 📦 (producto/caja)
  FaCalendarAlt,    // Para 📅 (calendario)
  FaMoneyBillWave,  // Para 💰 (dinero/cantidad)
  FaFileAlt,        // Para 📝 (observaciones/notas)
  FaChartBar,       // Para 📊 (estadísticas)
  FaExclamationTriangle // Para ⚠️ (advertencia)
} from 'react-icons/fa';

import {
  MdCalendarToday  // Alternativa para 🗓️ (día del mes)
} from 'react-icons/md';

interface CrearVentaProgramadaProps {
  onSuccess?: () => void;
  onClose: () => void;
}

const fecha = new Date().toISOString().split('T')[0];
const initialForm = {
  idcliente: '',
  idproducto: '',
  nombre_producto: '',
  unidad_medida: '',
  cantidad: 1,
  fecha_inicio: fecha,
  dia_programado: '',
  observacion: '',
};

const CrearVentaProgramada = ({ onSuccess, onClose }: CrearVentaProgramadaProps) => {
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState(initialForm);
  const [currentStep, setCurrentStep] = useState(1);

  const [showProductoModal, setShowProductoModal] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'dia_programado') {
      const dia = parseInt(value);
      if (value === '' || (dia >= 1 && dia <= 31)) {
        setFormData({ ...formData, [name]: value });
      }
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { idcliente, idproducto, fecha_inicio, dia_programado, cantidad } = formData;

    if (!idcliente || !idproducto || !fecha_inicio || !dia_programado) {
      setErrorMessage('  Completa todos los campos obligatorios.');
      setErrorModalOpen(true);
      return;
    }

    if (!cantidad || parseFloat(cantidad.toString()) <= 0) {
      setErrorMessage('  La cantidad debe ser mayor a 0.');
      setErrorModalOpen(true);
      return;
    }

    try {
      await createVentaProgramada({
        idcliente: Number(idcliente),
        idproducto: Number(idproducto),
        cantidad: formData.cantidad,
        fecha_inicio,
        dia_programado: Number(dia_programado),
        estado: 'activa',
        observacion: formData.observacion,
      });

      onSuccess && onSuccess();
      onClose();
      setSuccessModalOpen(true);
      setFormData(initialForm);
      setClienteSeleccionado(null);
    } catch (error: any) {
      setErrorMessage('  ' + (error.response?.data?.error || 'Error al crear venta programada'));
      setErrorModalOpen(true);
    }
  };

  const nextStep = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault(); // Evitar que se envíe el formulario

    if (currentStep === 1 && !clienteSeleccionado) {
      setErrorMessage('  Selecciona un cliente antes de continuar.');
      setErrorModalOpen(true);
      return;
    }
    if (currentStep === 2 && !formData.nombre_producto) {
      setErrorMessage('  Selecciona un producto antes de continuar.');
      setErrorModalOpen(true);
      return;
    }
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault(); // Evitar que se envíe el formulario
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const steps = [
    { num: 1, title: 'Cliente', icon: <FaUser /> },
    { num: 2, title: 'Producto', icon: <FaBox /> },
    { num: 3, title: 'Programación', icon: <FaCalendarAlt /> }
  ];


  return (
    <div className="bg-blue-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-sm font-bold bg-blue-600 dark:bg-gray-700 dark:text-gray-200 bg-clip-text text-transparent dark:bg-none mb-2">
            Nueva Venta Programada
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Configura una venta automática mensual en 3 pasos</p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.num} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${currentStep === step.num
                        ? 'bg-blue-600 dark:bg-gray-700 text-white shadow-lg scale-110'
                        : currentStep > step.num
                          ? 'bg-green-500 dark:bg-gray-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                      }`}
                  >
                    {currentStep > step.num ? '✓' : step.icon}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${currentStep === step.num ? 'text-blue-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'
                      }`}
                  >
                    {step.title}
                  </span>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-2 relative">
                    <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div
                      className={`absolute inset-0 bg-blue-600 dark:bg-gray-600 rounded transition-all duration-500 ${currentStep > step.num ? 'w-full' : 'w-0'
                        }`}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-6 min-h-[400px]">
            {/* Step 1: Cliente */}
            {currentStep === 1 && (
              <div className="animate-fade-in">
     <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
  <FaUser className="text-3xl" />
  Selecciona el Cliente
</h2>

                {clienteSeleccionado ? (
                  <div className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/20 dark:bg-gray-700/20 rounded-full -mr-16 -mt-16"></div>
                    <div className="border-2 border-green-400 dark:border-gray-600 bg-green-50 dark:bg-gray-700 rounded-2xl p-6 relative">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-12 h-12 bg-green-500 dark:bg-gray-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                              {clienteSeleccionado.nombre[0]}{clienteSeleccionado.apellido[0]}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-gray-200 text-xl">
                                {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Cliente seleccionado</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                            <div className="bg-white/60 dark:bg-gray-600 rounded-lg p-3">
                              <p className="text-xs text-gray-600 dark:text-gray-400">ID Cliente</p>
                              <p className="font-semibold text-gray-800 dark:text-gray-200">{clienteSeleccionado.idcliente}</p>
                            </div>
                            {clienteSeleccionado.numDocumento && (
                              <div className="bg-white/60 dark:bg-gray-600 rounded-lg p-3">
                                <p className="text-xs text-gray-600 dark:text-gray-400">CI/RUC</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{clienteSeleccionado.numDocumento}</p>
                              </div>
                            )}
                            {clienteSeleccionado.telefono && (
                              <div className="bg-white/60 dark:bg-gray-600 rounded-lg p-3">
                                <p className="text-xs text-gray-600 dark:text-gray-400">Teléfono</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{clienteSeleccionado.telefono}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setClienteSeleccionado(null);
                            setFormData(prev => ({ ...prev, idcliente: '' }));
                          }}
                          className="ml-4 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-gray-600 p-3 rounded-full transition-all duration-200 hover:scale-110"
                          title="Cambiar cliente"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClienteModal(true)}
                    className="w-full group relative overflow-hidden border-3 border-dashed border-blue-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-gray-500 bg-blue-50 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-gray-600 rounded-2xl p-12 transition-all duration-300 hover:shadow-xl"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 dark:bg-gray-600/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="w-20 h-20 mx-auto mb-4 bg-blue-500 dark:bg-gray-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <p className="text-xl font-bold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-gray-300 transition-colors">
                        Seleccionar Cliente
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Haz clic para elegir un cliente de la lista</p>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Step 2: Producto */}
            {currentStep === 2 && (
              <div className="animate-fade-in">
<h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
  <FaBox className="text-3xl" />
  Selecciona el Producto
</h2>
                {formData.nombre_producto ? (
                  <div className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 dark:bg-gray-700/20 rounded-full -mr-16 -mt-16"></div>
                    <div className="border-2 border-blue-400 dark:border-gray-600 bg-blue-50 dark:bg-gray-700 rounded-2xl p-6 relative">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
<div className="w-12 h-12 bg-blue-500 dark:bg-gray-600 rounded-xl flex items-center justify-center text-white text-2xl">
  <FaBox />
</div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-gray-200 text-xl">{formData.nombre_producto}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Producto seleccionado</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="bg-white/60 dark:bg-gray-600 rounded-lg p-3">
                              <p className="text-xs text-gray-600 dark:text-gray-400">ID Producto</p>
                              <p className="font-semibold text-gray-800 dark:text-gray-200">{formData.idproducto}</p>
                            </div>
                            {formData.unidad_medida && (
                              <div className="bg-white/60 dark:bg-gray-600 rounded-lg p-3">
                                <p className="text-xs text-gray-600 dark:text-gray-400">Unidad de Medida</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${formData.unidad_medida === 'CAJA'
                                    ? 'bg-orange-100 dark:bg-gray-600 text-orange-700 dark:text-gray-200'
                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                                  }`}>
                                  {formData.unidad_medida}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              idproducto: '',
                              nombre_producto: '',
                              unidad_medida: '',
                            }));
                          }}
                          className="ml-4 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-gray-600 p-3 rounded-full transition-all duration-200 hover:scale-110"
                          title="Cambiar producto"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowProductoModal(true)}
                    className="w-full group relative overflow-hidden border-3 border-dashed border-purple-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-gray-500 bg-purple-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-gray-600 rounded-2xl p-12 transition-all duration-300 hover:shadow-xl"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 dark:bg-gray-600/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="w-20 h-20 mx-auto mb-4 bg-purple-500 dark:bg-gray-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <p className="text-xl font-bold text-gray-700 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-gray-300 transition-colors">
                        Seleccionar Producto
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Haz clic para elegir un producto del catálogo</p>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Step 3: Programación */}
            {currentStep === 3 && (
              <div className="animate-fade-in">
<h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
  <FaCalendarAlt className="text-3xl" />
  Configuración de la Venta
</h2>
                <div className="space-y-6">
                  {/* Cantidad */}
                  <div className="bg-blue-50 dark:bg-gray-700 rounded-xl p-6 border border-blue-200 dark:border-gray-600">
<label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
  <FaMoneyBillWave /> Cantidad a Vender <span className="text-red-500">*</span>
</label>
                    <input
                      type="number"
                      name="cantidad"
                      min="0.001"
                      step="0.001"
                      value={formData.cantidad}
                      onChange={handleChange}
                      className="w-full border-2 border-blue-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm text-2xl font-bold text-center bg-white dark:bg-gray-800 dark:text-gray-200"
                      placeholder="0"
                    />
                    {formData.unidad_medida && (
                      <p className="text-xs text-blue-700 dark:text-gray-400 mt-2 font-medium">
                        <FaChartBar />
                        {formData.unidad_medida === 'CAJA'
                          ? 'Cantidad en unidades (se venderá por unidad aunque el producto sea tipo CAJA)'
                          : `Cantidad en ${formData.unidad_medida.toLowerCase()}`}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fecha Inicio */}
                    <div className="bg-green-50 dark:bg-gray-700 rounded-xl p-6 border border-green-200 dark:border-gray-600">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        <FaCalendarAlt /> Fecha de Inicio <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="fecha_inicio"
                        value={formData.fecha_inicio}
                        onChange={handleChange}
                        className="w-full border-2 border-green-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none shadow-sm bg-white dark:bg-gray-800 dark:text-gray-200"
                      />
                    </div>

                    {/* Día Programado */}
                    <div className={`rounded-xl p-6 border-2 transition-all ${parseInt(formData.dia_programado) > 28
                        ? 'bg-orange-50 dark:bg-gray-700 border-orange-300 dark:border-gray-600'
                        : 'bg-purple-50 dark:bg-gray-700 border-purple-200 dark:border-gray-600'
                      }`}>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        <MdCalendarToday />  Día del Mes <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="dia_programado"
                        min="1"
                        max="31"
                        value={formData.dia_programado}
                        onChange={handleChange}
                        placeholder="Ej: 15"
                        className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-4 outline-none shadow-sm text-2xl font-bold text-center ${parseInt(formData.dia_programado) > 28
                            ? 'border-orange-300 dark:border-gray-600 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-800 dark:text-gray-200'
                            : 'border-purple-300 dark:border-gray-600 focus:ring-purple-500/20 focus:border-purple-500 bg-white dark:bg-gray-800 dark:text-gray-200'
                          }`}
                      />
                      {parseInt(formData.dia_programado) > 28 && (
                        <div className="mt-3 bg-orange-100 dark:bg-gray-600 border border-orange-300 dark:border-gray-500 rounded-lg p-3">
                          <p className="text-xs text-orange-800 dark:text-gray-300 font-medium flex items-start gap-2">
                            <FaExclamationTriangle className="text-lg mt-0.5" />
                            <span>
                              Este día no existe en todos los meses. La venta se procesará el último día disponible.
                              {parseInt(formData.dia_programado) === 29 && ' (Febrero: 28/29 días)'}
                              {parseInt(formData.dia_programado) === 30 && ' (Febrero: 28/29 días)'}
                              {parseInt(formData.dia_programado) === 31 && ' (Meses cortos se ajustarán)'}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Observación */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      <FaFileAlt />  Observaciones (Opcional)
                    </label>
                    <input
                      type="text"
                      name="observacion"
                      value={formData.observacion}
                      onChange={handleChange}
                      placeholder="Agrega notas o comentarios adicionales..."
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 outline-none shadow-sm bg-white dark:bg-gray-800 dark:text-gray-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg"
            >
              Cancelar
            </button>

            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-gray-300 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg"
                >
                  ← Anterior
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-3 bg-blue-600 dark:bg-gray-700 hover:bg-blue-700 dark:hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-200 hover:shadow-xl hover:scale-105"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-8 py-3 bg-green-600 dark:bg-gray-700 hover:bg-green-700 dark:hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-200 hover:shadow-xl hover:scale-105 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar Venta Programada
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Modales */}
      <ModalSuccess
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message="  Venta programada creada con éxito"
      />
      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
      <ModalSeleccionarProducto
        isBuy={false}
        isOpen={showProductoModal}
        detalles={[]}
        configVentaPorLote={false}
        cantidadProducto={0}
        stockVerify={false}
        setCantidadMaximo={() => { }}
        setCantidadProducto={() => { }}
        onClose={() => setShowProductoModal(false)}
        onSelect={(producto) => {
          setFormData((prev) => ({
            ...prev,
            idproducto: producto.idproducto.toString(),
            nombre_producto: producto.nombre_producto,
            unidad_medida: producto.unidad_medida || 'UNIDAD',
          }));
          setShowProductoModal(false);
        }}
      />
      <ModalSeleccionarCliente
        isOpen={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        onSelect={(cliente) => {
          setClienteSeleccionado(cliente);
          setFormData((prev) => ({
            ...prev,
            idcliente: cliente.idcliente.toString(),
          }));
          setShowClienteModal(false);
        }}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }
    `}} />
    </div>
  );
};

export default CrearVentaProgramada;