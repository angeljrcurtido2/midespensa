'use client';

import { useState } from 'react';
import ModalSeleccionarCategoria from '../../../productos/components/ModalsProductos/ModalSeleccionarCategoria';
import ModalAdvert from '../../../components/ModalAdvert';
import { NumericFormat } from "react-number-format";

interface Props {
    onAgregar: (producto: any) => void;
}

const FormularioProducto = ({ onAgregar }: Props) => {
    const [form, setForm] = useState({
        nombre_producto: '',
        precio_compra: '',
        cod_barra: '',
        precio_venta: '',
        unidad_medida: '',
        iva: '',
        idcategoria: '',
        cantidad: '',
        cant_p_caja: '',
        cant_cajas: '',
        fecha_vencimiento: '',
        ubicacion: ''
    });
    const [modalAdvertOpen, setModalAdvertOpen] = useState(false);
    const [modalConfirm, setModalConfirm] = useState("");
    const [showCategoriaModal, setShowCategoriaModal] = useState(false);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<any>(null);

    // Función para calcular campos faltantes automáticamente
    const calcularCamposFaltantes = (formActualizado: any, campoModificado: string) => {
        if (formActualizado.unidad_medida !== 'CAJA') {
            return formActualizado;
        }

        const { cant_cajas, cant_p_caja, cantidad } = formActualizado;

        // Convertir a números
        const cajas = parseFloat(cant_cajas) || 0;
        const porCaja = parseFloat(cant_p_caja) || 0;
        const total = parseFloat(cantidad) || 0;

        let nuevoForm = { ...formActualizado };

        // Si modificó cantidad de cajas o unidades por caja → calcular total
        if ((campoModificado === 'cant_cajas' || campoModificado === 'cant_p_caja') && cajas > 0 && porCaja > 0) {
            nuevoForm.cantidad = (cajas * porCaja).toString();
        }

        // Si modificó cantidad total y tiene cajas → calcular unidades por caja  
        else if (campoModificado === 'cantidad' && cajas > 0 && total > 0) {
            nuevoForm.cant_p_caja = (total / cajas).toFixed(2);
        }

        // Si modificó cantidad total y tiene unidades por caja pero no cajas → calcular cajas
        else if (campoModificado === 'cantidad' && porCaja > 0 && total > 0 && cajas === 0) {
            nuevoForm.cant_cajas = Math.ceil(total / porCaja).toString();
        }

        return nuevoForm;
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;

        // Actualizar el campo modificado
        const formActualizado = {
            ...form,
            [name]: value
        };

        // Calcular campos automáticamente si es unidad CAJA
        const formConCalculos = calcularCamposFaltantes(formActualizado, name);
        setForm(formConCalculos);
    };

    // Validación específica para cajas
    const validarCajas = () => {
        if (form.unidad_medida !== 'CAJA') return { valido: true };

        const cajas = parseFloat(form.cant_cajas) || 0;
        const porCaja = parseFloat(form.cant_p_caja) || 0;
        const total = parseFloat(form.cantidad) || 0;

        // Debe tener al menos cantidad por caja
        if (porCaja <= 0) {
            return {
                valido: false,
                mensaje: "La cantidad por caja es obligatoria y debe ser mayor a 0"
            };
        }

        // Verificar coherencia matemática si todos los campos están llenos
        if (cajas > 0 && porCaja > 0 && total > 0) {
            const totalCalculado = cajas * porCaja;
            const diferencia = Math.abs(totalCalculado - total);

            if (diferencia > 0.01) { // Tolerancia para decimales
                return {
                    valido: false,
                    mensaje: `Los números no coinciden: ${cajas} cajas × ${porCaja} = ${totalCalculado.toFixed(2)}, pero indicaste ${total} total`
                };
            }
        }

        return { valido: true };
    };

    const handleAgregar = () => {
        // Validación básica
        if (!form.nombre_producto || !form.precio_compra || !form.precio_venta || !form.unidad_medida || !form.iva || !form.idcategoria || !form.cantidad) {
            setModalConfirm('Completá todos los campos obligatorios.');
            setModalAdvertOpen(true);
            return;
        }

        // Validación específica para cajas
        const validacionCajas = validarCajas();
        if (!validacionCajas.valido) {
            setModalConfirm(validacionCajas.mensaje ?? "");
            setModalAdvertOpen(true);
            return;
        }

        onAgregar(form);
        setForm({
            nombre_producto: '',
            precio_compra: '',
            cod_barra: '',
            precio_venta: '',
            unidad_medida: '',
            iva: '',
            idcategoria: '',
            cantidad: '',
            cant_p_caja: '',
            cant_cajas: '',
            fecha_vencimiento: '',
            ubicacion: ''
        });
        setCategoriaSeleccionada(null);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 mb-2">
            {/* Header */}
            <div className="mb-6 border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900">Agregar Nuevo Producto</h3>
                <p className="text-sm text-gray-600 mt-1">Complete la información del producto a registrar</p>
            </div>

            {/* Información Básica */}
            <div className="mb-2">
                <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">1</span>
                    Información Básica
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Producto <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="nombre_producto"
                            value={form.nombre_producto}
                            onChange={handleChange}
                            placeholder="Ej: Producto X"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Código de Barras
                        </label>
                        <input
                            type="text"
                            name="cod_barra"
                            value={form.cod_barra}
                            onChange={handleChange}
                            placeholder="7891000053508"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Categoría <span className="text-red-500">*</span>
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowCategoriaModal(true)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white hover:bg-gray-50 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {categoriaSeleccionada ? categoriaSeleccionada.categoria : 'Seleccionar Categoría'}
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ubicación
                        </label>
                        <input
                            type="text"
                            name="ubicacion"
                            value={form.ubicacion}
                            onChange={handleChange}
                            placeholder="Estante A1"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Precios y Configuración */}
            <div className="mb-2">
                <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                    <span className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">2</span>
                    Precios y Configuración
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Precio de Compra <span className="text-red-500">*</span>
                        </label>
                        <NumericFormat
                            value={form.precio_compra}
                            thousandSeparator="."
                            decimalSeparator=","
                            decimalScale={2}
                            fixedDecimalScale={false}
                            allowNegative={false}
                            onValueChange={(values) => {
                                setForm(prev => ({ ...prev, precio_compra: values.value || '' }));
                            }}
                            placeholder="0,00"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Precio de Venta <span className="text-red-500">*</span>
                        </label>
                        <NumericFormat
                            value={form.precio_venta}
                            thousandSeparator="."
                            decimalSeparator=","
                            decimalScale={2}
                            fixedDecimalScale={false}
                            allowNegative={false}
                            onValueChange={(values) => {
                                setForm(prev => ({ ...prev, precio_venta: values.value || '' }));
                            }}
                            placeholder="0,00"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unidad de Medida <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="unidad_medida"
                            value={form.unidad_medida}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Seleccionar</option>
                            <option value="KG">Kilogramo (KG)</option>
                            <option value="UNIDAD">Unidad</option>
                            <option value="PAQUETE">Paquete</option>
                            <option value="CAJA">Caja</option>
                            <option value="LITRO">Litro (L)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            IVA <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="iva"
                            value={form.iva}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Seleccionar</option>
                            <option value="0">Exenta</option>
                            <option value="5">5%</option>
                            <option value="10">10%</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Configuración de Cajas (Condicional) */}
            {form.unidad_medida === "CAJA" && (
                <div className="mb-2">
                    <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                        <span className="bg-orange-100 text-orange-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">📦</span>
                        Configuración de Cajas
                    </h4>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <p className="text-sm text-orange-700 mb-4 font-medium">
                            💡 Complete 2 campos y el tercero se calculará automáticamente
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cantidad de Cajas
                                    {parseFloat(form.cant_cajas || '0') > 0 && parseFloat(form.cant_p_caja || '0') > 0 && (
                                        <span className="text-orange-600 text-xs ml-1">→ Calculando total</span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    name="cant_cajas"
                                    value={form.cant_cajas}
                                    onChange={handleChange}
                                    placeholder="Ej: 2"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                                <p className="text-xs text-gray-600 mt-1">Número de cajas físicas</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Unidades por Caja <span className="text-red-500">*</span>
                                    {parseFloat(form.cantidad || '0') > 0 && parseFloat(form.cant_cajas || '0') > 0 && (
                                        <span className="text-orange-600 text-xs ml-1">✓ Calculado</span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="cant_p_caja"
                                    value={form.cant_p_caja}
                                    onChange={handleChange}
                                    placeholder="Ej: 30"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                                <p className="text-xs text-gray-600 mt-1">Unidades que contiene cada caja</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tot. de Unidades <span className="text-red-500">*</span>
                                    {parseFloat(form.cant_cajas || '0') > 0 && parseFloat(form.cant_p_caja || '0') > 0 && (
                                        <span className="text-green-600 text-xs ml-1">✓ Cal. automátic.</span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    name="cantidad"
                                    value={form.cantidad}
                                    onChange={handleChange}
                                    placeholder="Ej: 60"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                                <p className="text-xs text-gray-600 mt-1">Total de unidades individuales</p>
                            </div>
                        </div>

                        {/* Indicador visual de cálculo */}
                        {parseFloat(form.cant_cajas || '0') > 0 && parseFloat(form.cant_p_caja || '0') > 0 && parseFloat(form.cantidad || '0') > 0 && (
                            <div className=" p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-700">
                                    <span className="font-medium">Resumen:</span> {form.cant_cajas} cajas × {form.cant_p_caja} unidades = {form.cantidad} unidades totales
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Stock y Fecha de Vencimiento */}
            {form.unidad_medida !== "CAJA" && (
                <div className="mb-2">
                    <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                        <span className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">3</span>
                        Stock y Vencimiento
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cantidad en Stock <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="cantidad"
                                value={form.cantidad}
                                onChange={handleChange}
                                placeholder="100"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha de Vencimiento
                            </label>
                            <input
                                type="date"
                                name="fecha_vencimiento"
                                value={form.fecha_vencimiento}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>
            )}
            <div className='flex flex-row gap-9'>
                {/* Fecha de Vencimiento para productos en caja */}
                {form.unidad_medida === "CAJA" && (
                    <div className="mb-2">
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha de Vencimiento
                                </label>
                                <input
                                    type="date"
                                    name="fecha_vencimiento"
                                    value={form.fecha_vencimiento}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Botón de Acción */}

                <div className="flex justify-end items-end">
                    <button
                        type="button"
                        onClick={handleAgregar}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-3 rounded-full font-medium shadow-sm transition-colors duration-200 flex items-center gap-2"
                    >
                        <span className="text-sm">➕</span>
                        Agregar Producto
                    </button>
                </div>

            </div>
            {/* MODALES */}
            <ModalSeleccionarCategoria
                isOpen={showCategoriaModal}
                onClose={() => setShowCategoriaModal(false)}
                onSelect={(categoria: any) => {
                    setCategoriaSeleccionada(categoria);
                    setForm(prev => ({ ...prev, idcategoria: categoria.idcategorias }));
                    setShowCategoriaModal(false);
                }}
            />
            <ModalAdvert
                isOpen={modalAdvertOpen}
                onClose={() => setModalAdvertOpen(false)}
                message={modalConfirm}
                onConfirm={() => {
                    setModalAdvertOpen(false);
                }}
            />
        </div>
    );
};

export default FormularioProducto;