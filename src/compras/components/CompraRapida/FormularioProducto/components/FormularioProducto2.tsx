'use client';

import { useState } from 'react';
import ModalAdvert from '../../../../../components/ModalAdvert';
import { NumericFormat } from 'react-number-format';
import ModalPrecioCompra from './ModalPrecioCompra';
import SeccionPresentaciones from './SeccionPresentaciones';
import { resaltarCampos, limpiarInvalidos } from '../../../../../utils/camposInvalidos';
import { styleforStep, styleforStepBox, styleTitleBox } from '../utils/style';

interface FormData {
    nombre_producto: string;
    precio_compra: string;
    cod_barra: string;
    precio_venta: string;
    precio_venta_caja: string;
    precio_venta_pack: string;
    unidad_medida: string;
    iva: string;
    idcategoria: string;
    cantidad: string;
    cant_p_caja: string;
    cant_p_pack: string;
    cant_cajas: string;
    fecha_vencimiento: string;
    ubicacion: string;
    precio_compra_caja?: string;
    numero_lote: string;
    referencia_proveedor: string;
    ubicacion_almacen: string;
}

interface Props {
    setModalShowOptionCostBuy: (value: string) => void;
    opcionSeleccionada?: string;
    setOpcionSeleccionada?: (value: string) => void;
    modalShowOptionCostBuy: string;
    form: FormData;
    setPrecioCompraTest: (value: string) => void;
    onFormChange: (form: FormData, campo?: string) => void;
    onAgregar: (producto: any) => void;
    onProcesoCompraChange?: (value: boolean) => void;
    productosNuevos?: any[];
}

const FormularioProducto2 = ({ productosNuevos, setPrecioCompraTest, onProcesoCompraChange, setOpcionSeleccionada, opcionSeleccionada, setModalShowOptionCostBuy, modalShowOptionCostBuy, form, onFormChange, onAgregar }: Props) => {
    const [modalAdvertOpen, setModalAdvertOpen] = useState(false);
    const [modalConfirm, setModalConfirm] = useState("");
    // Tras apretar «Agregar Producto» con algo faltante: se resalta en pantalla y esta lista se va vaciando a medida que se completa.
    const [intentoAgregar, setIntentoAgregar] = useState(false);
    const [precioVentaManual, setPrecioVentaManual] = useState<'unitario' | 'caja' | null>(null);

    // Función para calcular campos faltantes automáticamente
    const calcularCamposFaltantes = (formActualizado: any, campoModificado: string) => {
        if (formActualizado.unidad_medida !== 'CAJA') {
            return formActualizado;
        }

        const { cant_cajas, cant_p_caja, cantidad, precio_compra, precio_compra_caja, precio_venta, precio_venta_caja } = formActualizado;

        // Convertir a números
        const cajas = parseFloat(cant_cajas) || 0;
        const porCaja = parseFloat(cant_p_caja) || 0;
        const total = parseFloat(cantidad) || 0;
        const precioUnitario = parseFloat(precio_compra) || 0;
        const precioCaja = parseFloat(precio_compra_caja) || 0;
        const precioVentaUnitario = parseFloat(precio_venta) || 0;
        const precioVentaCaja = parseFloat(precio_venta_caja) || 0;

        let nuevoForm = { ...formActualizado };

        // Si modificó cantidad total y tiene unidades por caja → calcular cantidad de cajas
        if (campoModificado === 'cantidad' && porCaja > 0 && total > 0) {
            nuevoForm.cant_cajas = (total / porCaja).toFixed(2);
        }

        // Si modificó unidades por caja y tiene cantidad total → recalcular cantidad de cajas
        else if (campoModificado === 'cant_p_caja' && porCaja > 0 && total > 0) {
            nuevoForm.cant_cajas = (total / porCaja).toFixed(2);
        }

        // Si escribió primero las cajas y después las unidades por caja → calcular el total de unidades
        // (antes la cantidad quedaba en 0 y la compra se perdía o entraba sin stock)
        else if (campoModificado === 'cant_p_caja' && porCaja > 0 && cajas > 0) {
            nuevoForm.cantidad = String(Math.round(cajas * porCaja * 1000) / 1000);
        }

        // Si modificó cantidad de cajas y tiene unidades por caja → calcular total (caso menos común)
        else if (campoModificado === 'cant_cajas' && cajas > 0 && porCaja > 0) {
            nuevoForm.cantidad = (cajas * porCaja).toString();
        }

        // SOLUCIÓN: Solo calcular precio por caja automáticamente si NO estamos en modo "caja_total"
        if (opcionSeleccionada !== "caja_total") {
            // Calcular precio por caja automáticamente cuando tenemos precio unitario
            if (precioUnitario > 0 && porCaja > 0) {
                nuevoForm.precio_compra_caja = (precioUnitario * porCaja).toFixed(2);
            }
        } else {
            // Si estamos en modo "caja_total" y se modificaron las unidades, recalcular precio unitario
            if (precioCaja > 0 && porCaja > 0 && (campoModificado === 'cant_p_caja' || campoModificado === 'cantidad')) {
                const nuevoPrecioUnitario = (precioCaja / porCaja).toFixed(4);
                nuevoForm.precio_compra = nuevoPrecioUnitario;
                setPrecioCompraTest(nuevoPrecioUnitario);
            }
        }

        //   CORREGIDO: Lógica de precio de venta basada en qué campo fue modificado manualmente

        if (false && campoModificado === 'precio_venta') {
            // Usuario modificó el precio unitario manualmente
            setPrecioVentaManual('unitario');
            if (precioVentaUnitario > 0 && porCaja > 0) {
                nuevoForm.precio_venta_caja = (precioVentaUnitario * porCaja).toFixed(2);
            }
        }
        else if (false && campoModificado === 'precio_venta_caja') {
            // Usuario modificó el precio por caja manualmente
            setPrecioVentaManual('caja');
            if (precioVentaCaja > 0 && porCaja > 0) {
                nuevoForm.precio_venta = (precioVentaCaja / porCaja).toFixed(4);
            }
        }
        else if (false && campoModificado === 'cant_p_caja' && porCaja > 0) {
            // Si cambió cant_p_caja, recalcular basado en cuál fue el último modificado manualmente
            if (precioVentaManual === 'caja' && precioVentaCaja > 0) {
                // Si el usuario había modificado el precio por caja, recalcular el unitario
                nuevoForm.precio_venta = (precioVentaCaja / porCaja).toFixed(4);
            } else if (precioVentaManual === 'unitario' && precioVentaUnitario > 0) {
                // Si el usuario había modificado el precio unitario, recalcular el precio por caja
                nuevoForm.precio_venta_caja = (precioVentaUnitario * porCaja).toFixed(2);
            } else if (!precioVentaManual) {
                // Si no hay ninguno manual, calcular precio_venta_caja a partir del unitario si existe
                if (precioVentaUnitario > 0) {
                    nuevoForm.precio_venta_caja = (precioVentaUnitario * porCaja).toFixed(2);
                }
            }
        }

        return nuevoForm;
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;

        const formActualizado = {
            ...form,
            [name]: value
        };

        //   Pasar el campo modificado
        const formConCalculos = calcularCamposFaltantes(formActualizado, name);
        onFormChange(formConCalculos, name);
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

        // Verificar coherencia matemática con la nueva lógica: cantidad ÷ unidades_por_caja = cajas
        if (cajas > 0 && porCaja > 0 && total > 0) {
            const cajasCalculadas = total / porCaja;
            const diferencia = Math.abs(cajasCalculadas - cajas);

            if (diferencia > 0.01) { // Tolerancia para decimales
                return {
                    valido: false,
                    mensaje: `Los números no coinciden: ${total} unidades ÷ ${porCaja} por caja = ${cajasCalculadas.toFixed(2)} cajas, pero indicaste ${cajas} cajas`
                };
            }
        }

        return { valido: true };
    };

    /** Lo que falta o está mal, con el campo en pantalla donde se corrige. */
    const calcularFaltantes = (): { clave: string; etiqueta: string; detalle?: string }[] => {
        const f: { clave: string; etiqueta: string; detalle?: string }[] = [];
        if (!form.nombre_producto?.trim()) f.push({ clave: '[name="nombre_producto"]', etiqueta: 'Nombre del producto' });
        if (!form.idcategoria) f.push({ clave: 'idcategoria', etiqueta: 'Categoría' });
        if (!form.unidad_medida) f.push({ clave: '[name="unidad_medida"]', etiqueta: 'Unidad' });
        if (!form.iva) f.push({ clave: '[name="iva"]', etiqueta: 'IVA' });
        if (!(parseFloat(form.precio_compra) > 0) && !(parseFloat(form.precio_compra_caja || '0') > 0)) f.push({ clave: 'precio_compra', etiqueta: 'Precio de compra' });
        if (!form.precio_venta) f.push({ clave: 'precio_venta', etiqueta: 'Precio de venta' });
        if (form.unidad_medida === 'CAJA' && !(parseFloat(form.cant_p_caja) > 0)) f.push({ clave: '[name="cant_p_caja"]', etiqueta: 'Unidades por caja' });
        const porPack = parseFloat(form.cant_p_pack) || 0;
        const precioPack = parseFloat(form.precio_venta_pack) || 0;
        if (porPack > 0 && porPack < 2) f.push({ clave: 'cant_p_pack', etiqueta: 'Unidades por pack', detalle: 'tiene que ser 2 o más' });
        if (porPack >= 2 && !(precioPack > 0)) f.push({ clave: 'precio_venta_pack', etiqueta: 'Precio de venta del pack' });
        if (precioPack > 0 && !(porPack >= 2)) f.push({ clave: 'cant_p_pack', etiqueta: 'Unidades por pack' });
        // '0' es el valor inicial del campo: sin esta comprobación se podía agregar un producto con stock 0.
        if (!(parseFloat(form.cantidad) > 0)) f.push({ clave: '[name="cantidad"]', etiqueta: 'Cantidad en stock (mayor a 0)' });
        return f;
    };

    const faltantes = intentoAgregar ? calcularFaltantes() : [];

    const handleAgregar = () => {
        setIntentoAgregar(true);
        const pendientes = calcularFaltantes();
        if (pendientes.length > 0) {
            resaltarCampos(pendientes.map((p) => p.clave));
            return;
        }

        // Validación específica para cajas
        const validacionCajas = validarCajas();
        if (!validacionCajas.valido) {
            resaltarCampos(['[name="cant_p_caja"]', '[name="cantidad"]']);
            setModalConfirm(validacionCajas.mensaje ?? "");
            setModalAdvertOpen(true);
            return;
        }

        limpiarInvalidos();
        setIntentoAgregar(false);
        onAgregar(form);
    };

    return (
        <>
            {/* Configuración de Cajas (Condicional) */}


            {/* Presentaciones de venta: unidad suelta, pack/blíster y caja */}
            <SeccionPresentaciones form={form} onFormChange={onFormChange} />
            <div className='flex flex-row gap-4 px-2'>

                <div className="w-auto bg-orange-50/60 dark:bg-gray-800 rounded-xl p-2 border border-orange-100 dark:border-gray-700">
                    <div className={styleforStep}>
                        <div className="bg-orange-600 text-white rounded-full px-3 py-1 text-sm font-extrabold">
                            {form.unidad_medida === "CAJA" ? "PASO 4" : "PASO 3"}
                        </div>
                        <h4 className={styleTitleBox}>Información de Lote</h4>
                    </div>

                    <div className="flex flex-col gap-4">

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                Núm. de Lote{' '}<span className="text-xs font-medium text-slate-500 dark:text-gray-400">(opcional: si lo dejás vacío se usa 01)</span>
                            </label>
                            <input
                                type="text"
                                name="numero_lote"
                                value={form.numero_lote}
                                onChange={handleChange}
                                placeholder="PROV-2025-ABC"
                                className="w-full bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-400 focus:ring-4 focus:ring-amber-200 dark:focus:ring-amber-800 focus:border-amber-500 transition-all shadow-sm hover:shadow-md"
                            />
                        </div>
                        <div className={styleforStepBox}>
                            <div>
                                <label className="truncate block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                    Ref. del Prov.
                                </label>
                                <input
                                    type="text"
                                    name="referencia_proveedor"
                                    value={form.referencia_proveedor}
                                    onChange={handleChange}
                                    placeholder="REF-123"
                                    className="w-full bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-400 focus:ring-4 focus:ring-amber-200 dark:focus:ring-amber-800 focus:border-amber-500 transition-all shadow-sm hover:shadow-md"
                                />
                            </div>

                            <div className=''>
                                <label className="truncate text-sm font-semibold text-slate-700 dark:text-gray-300 mb-4">
                                    Ubi. en Almacén
                                </label>
                                <select
                                    name="ubicacion_almacen"
                                    value={form.ubicacion_almacen}
                                    onChange={handleChange}
                                    className="w-full mt-1 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100 focus:ring-4 focus:ring-amber-200 dark:focus:ring-amber-800 focus:border-amber-500 transition-all shadow-sm hover:shadow-md cursor-pointer"
                                >
                                    <option value="PRINCIPAL">Principal</option>
                                    <option value="ESTANTE-A1">Estante A1</option>
                                    <option value="ESTANTE-A2">Estante A2</option>
                                    <option value="ESTANTE-A3">Estante A3</option>
                                    <option value="REFRIGERADOR">Refrigerador</option>
                                    <option value="BODEGA">Bodega</option>
                                </select>

                            </div>
                        </div>
                    </div>
                </div>


                {/* Stock y Fecha de Vencimiento para productos no CAJA */}
                {form.unidad_medida !== "CAJA" && (

                    <div className="w-full bg-orange-50/60 dark:bg-gray-800 rounded-xl p-2 border border-orange-100 dark:border-gray-700">
                        <div className={styleforStep}>
                            <div className="bg-orange-600 text-white rounded-full px-3 py-1 text-sm font-extrabold">
                                PASO 4
                            </div>
                            <h4 className={styleTitleBox}>Stock y Vencimiento</h4>
                        </div>

                        <div className={styleforStepBox}>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                    Cantidad en Stock <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="cantidad"
                                    value={form.cantidad}
                                    onChange={handleChange}
                                    placeholder="100"
                                    className="w-full bg-white dark:bg-gray-700 border-2 border-purple-200 dark:border-purple-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-400 focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-800 focus:border-purple-500 transition-all shadow-sm hover:shadow-md"
                                />
                            </div>

                            <div>
                                <label className="truncate block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                    Fecha de Vencimiento
                                </label>
                                <input
                                    type="date"
                                    name="fecha_vencimiento"
                                    value={form.fecha_vencimiento}
                                    onChange={handleChange}
                                    className="w-full bg-white border-2 border-purple-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all shadow-sm hover:shadow-md"
                                />
                            </div>
                        </div>
                    </div>

                )}

                {form.unidad_medida === "CAJA" && (

                    <div className="bg-orange-50/60 dark:bg-gray-800 rounded-xl p-4 border border-orange-100 dark:border-gray-700">
                        <div className={styleforStep}>
                            <div className="bg-orange-600 text-white rounded-full px-3 py-1 text-sm font-extrabold">
                                PASO 3
                            </div>
                            <h4 className={styleTitleBox}>Configuración de Cajas</h4>
                            <div className="truncate flex flex-row border border-orange-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-full px-3 py-1 text-xs font-medium text-slate-700 dark:text-gray-200">
                                <div className="flex flex-col text-center">
                                    <p className="text-sm font-bold mb-1">Resumen del Cálculo</p>
                                    <p className="text-xs">
                                        {form.cantidad} unidades ÷ {form.cant_p_caja} por caja = <span className="font-bold">{form.cant_cajas} cajas</span>
                                    </p>
                                </div>
                                {/* Resumen de cálculo */}
                                {parseFloat(form.cant_cajas || '0') > 0 && parseFloat(form.cant_p_caja || '0') > 0 && parseFloat(form.cantidad || '0') > 0 && (

                                    <div className="flex flex-col sm:flex-row gap-3 text-center">

                                        {opcionSeleccionada === "por_unidad" && form.precio_compra_caja && (
                                            <div className="flex-1">
                                                <p className="text-sm font-bold mb-1">Precio por Caja</p>
                                                <p className="text-xs text-emerald-600">
                                                    Gs. {parseFloat(form.precio_compra_caja).toLocaleString("es-PY")} ({parseFloat(form.precio_compra).toLocaleString("es-PY")} × {form.cant_p_caja})
                                                </p>
                                            </div>
                                        )}
                                        {opcionSeleccionada === "caja_total" && form.precio_compra_caja && (
                                            <div className="flex-1">
                                                <p className="text-sm font-bold  mb-1">Precio Fijo por Caja</p>
                                                <p className="text-xs ">
                                                    Gs. {parseFloat(form.precio_compra_caja).toLocaleString("es-PY")}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                )}
                            </div>

                        </div>

                        <div className='flex flex-col gap-3'>
                            <div className={styleforStepBox}>
                                <div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                            Cant. de Cajs.

                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="cant_cajas"
                                            value={form.cant_cajas}
                                            onChange={handleChange}
                                            placeholder="1.83"
                                            className="w-full bg-white dark:bg-gray-700 border-2 border-orange-200 dark:border-orange-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-400 focus:ring-4 focus:ring-orange-200 dark:focus:ring-orange-800 focus:border-orange-500 transition-all shadow-sm hover:shadow-md"
                                        />
                                        <p className="truncate text-xs text-slate-600 dark:text-gray-400 font-medium mt-1.5">Cantidad ÷ unidades por caja</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                            Unid. por Caja <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="1"
                                            min="1"
                                            name="cant_p_caja"
                                            value={form.cant_p_caja}
                                            onChange={handleChange}
                                            placeholder="30"
                                            className="w-full bg-white dark:bg-gray-700 border-2 border-orange-200 dark:border-orange-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-400 focus:ring-4 focus:ring-orange-200 dark:focus:ring-orange-800 focus:border-orange-500 transition-all shadow-sm hover:shadow-md"
                                        />
                                        <p className="text-xs text-slate-600 dark:text-gray-400 font-medium mt-1.5">Unidades que contiene cada caja</p>
                                    </div>
                                </div>
                                <div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                            Cant. Comprada <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="cantidad"
                                            value={form.cantidad}
                                            onChange={handleChange}
                                            placeholder="55"
                                            className="w-full bg-white dark:bg-gray-700 border-2 border-orange-200 dark:border-orange-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-400 focus:ring-4 focus:ring-orange-200 dark:focus:ring-orange-800 focus:border-orange-500 transition-all shadow-sm hover:shadow-md"
                                        />
                                        <p className="truncate text-xs text-slate-600 dark:text-gray-400 font-medium mt-1.5">Total de unidades compradas</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2 truncate">
                                            {opcionSeleccionada === "caja_total" ? "Precio x und*" : "Precio x caja*"}
                                        </label>

                                        <NumericFormat
                                            value={opcionSeleccionada === "caja_total"
                                                ? (parseFloat(form.precio_compra_caja ?? '0') / parseFloat(form.cant_p_caja || '1')).toFixed(4)
                                                : (parseFloat(form.precio_compra) * parseFloat(form.cant_p_caja))
                                            }
                                            thousandSeparator="."
                                            decimalSeparator=","
                                            decimalScale={2}
                                            fixedDecimalScale={false}
                                            allowNegative={false}
                                            disabled={true}
                                            className="w-full bg-gradient-to-r from-slate-100 to-slate-50 dark:from-gray-700 dark:to-gray-800 border-2 border-slate-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 dark:text-gray-300 cursor-not-allowed shadow-inner"
                                        />
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1.5">
                                            {opcionSeleccionada === "caja_total"
                                                ? "Precio caja ÷ und x caja"
                                                : "Precio und × und x caja"
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                    Fecha de Vencimiento
                                </label>
                                <input
                                    type="date"
                                    name="fecha_vencimiento"
                                    value={form.fecha_vencimiento}
                                    onChange={handleChange}
                                    className="w-full bg-white dark:bg-gray-700 border-2 border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
                                />
                            </div>
                        </div>



                    </div>
                )}


            </div>

            {faltantes.length > 0 && (
                <div role="alert" className="mx-2 mt-2 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-700/60 dark:bg-red-900/20 dark:text-red-100">
                    <p className="font-extrabold">Falta completar {faltantes.length === 1 ? 'este dato' : 'estos datos'} (están marcados en rojo):</p>
                    <ul className="mt-1 flex flex-wrap gap-2">
                        {faltantes.map((f) => (
                            <li key={f.clave}>
                                <button type="button" onClick={() => resaltarCampos([f.clave])} className="rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-200">
                                    {f.etiqueta}{f.detalle ? ` · ${f.detalle}` : ''}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Botón de Acción */}
            <div id="compra-rapida-final-formulario" className="h-px" aria-hidden="true" />

            <div data-testid="barra-acciones" className="sticky bottom-0 z-20 -mx-1 mt-2 flex w-auto flex-row items-center justify-center gap-3 border-t border-blue-200 bg-white/95 px-2 py-2 shadow-[0_-8px_16px_-10px_rgba(15,40,100,0.35)] backdrop-blur dark:border-gray-600 dark:bg-gray-800/95">
                <button
                    type="button"
                    onClick={handleAgregar}
                    className="w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                    <span>Agregar Producto</span>
                </button>
                {productosNuevos && productosNuevos.length > 0 && (
                    <button
                        type="button"
                        onClick={() => onProcesoCompraChange?.(true)}
                        className="w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        <span>Registrar Producto</span>
                    </button>
                )}
            </div>


            <ModalPrecioCompra
                isOpen={!!modalShowOptionCostBuy}
                onClose={() => setModalShowOptionCostBuy("")}
                onConfirm={() => setModalShowOptionCostBuy("")}
                setOpcionSeleccionada={setOpcionSeleccionada}
                opcionSeleccionada={opcionSeleccionada}
            />

            {/* Modal de Advertencia */}
            <ModalAdvert
                isOpen={modalAdvertOpen}
                onClose={() => setModalAdvertOpen(false)}
                message={modalConfirm}
                onConfirm={() => {
                    setModalAdvertOpen(false);
                }}
            />

        </>
    );
};

export default FormularioProducto2;
