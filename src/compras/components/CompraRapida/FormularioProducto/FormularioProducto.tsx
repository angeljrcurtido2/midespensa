import { IA_HABILITADA } from '../../../../config/featureFlags';
'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import FormularioProducto1 from './components/FormularioProducto1';
import FormularioProducto2 from './components/FormularioProducto2';
import ReconocerProductoFoto from '../../../../components/ReconocerProductoFoto';
import type { CategoriaEncontrada } from '../../../../utils/buscarCategoriaPorNombre';
import ModalAdvert from '../../../../components/ModalAdvert';
import { normalizarAPack, type ProductoDetectado, type ProductoCoincidente } from '../../../../services/reconocimiento';

export interface ProductoPrecargado {
    producto: ProductoDetectado;
    categoria: CategoriaEncontrada | null;
}

interface Props {
    onAgregar: (producto: any) => void;
    onShowModalConfirm?: (value:boolean) => void;
    productosNuevos: any[];
    dataHeader?: {
        totalProductos: number;
        totalCantidad: number;
        totalValor: number;
    };
    // Datos detectados por foto en otra pantalla (Productos → Reconocer →
    // "Crear este producto"): el form arranca ya completado con ellos.
    productoInicial?: ProductoPrecargado | null;
}

const FormularioProducto = ({ dataHeader, onAgregar, onShowModalConfirm, productosNuevos, productoInicial }: Props) => {
    const [modalShowOptionCostBuy, setModalShowOptionCostBuy] = useState('');
    const [mostrarAvisoScroll, setMostrarAvisoScroll] = useState(false);
    const [imagenProducto, setImagenProducto] = useState<File | null>(null);

    useEffect(() => {
        const finalFormulario = document.getElementById('compra-rapida-final-formulario');
        if (!finalFormulario) return;
        const observador = new IntersectionObserver(([entrada]) => {
            setMostrarAvisoScroll(!entrada.isIntersecting);
        }, { threshold: 0 });
        observador.observe(finalFormulario);
        return () => observador.disconnect();
    }, []);
    const [form, setForm] = useState({
        nombre_producto: '',
        precio_compra: '',
        precio_compra_caja: '',
        cod_barra: '',
        precio_venta: '',
        precio_venta_caja: '',
        precio_venta_pack: '',
        unidad_medida: '',
        iva: '',
        idcategoria: '',
        cantidad: '0',
        cant_p_caja: '',
        cant_p_pack: '',
        cant_cajas: '',
        fecha_vencimiento: '',
        ubicacion: '',
        numero_lote: '01',
        referencia_proveedor: '',
        ubicacion_almacen: 'PRINCIPAL',
        principio_activo: '',
        laboratorio: '',
        receta: 'libre',
        stock_minimo: ''
    });

    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<any>(null);
    const [opcionSeleccionada, setOpcionSeleccionada] = useState('');
    const [precioCompraTest, setPrecioCompraTest] = useState("");

    //   NUEVO: Estado para rastrear qué precio de venta fue modificado manualmente
    const [precioVentaManual, setPrecioVentaManual] = useState<'unitario' | 'caja' | null>(null);

    //   NUEVA: Función compartida para calcular precio_venta_caja automáticamente
    const calcularPrecioVentaCaja = (formActualizado: any, campoModificado: string) => {
        if (true) {
            return formActualizado;
        }

        const porCaja = parseFloat(formActualizado.cant_p_caja) || 0;
        const precioVentaUnitario = parseFloat(formActualizado.precio_venta) || 0;
        const precioVentaCaja = parseFloat(formActualizado.precio_venta_caja) || 0;

        let nuevoForm = { ...formActualizado };

        if (campoModificado === 'precio_venta') {
            // Usuario modificó el precio unitario manualmente
            setPrecioVentaManual('unitario');
            if (precioVentaUnitario > 0 && porCaja > 0) {
                nuevoForm.precio_venta_caja = (precioVentaUnitario * porCaja).toFixed(2);
            }
        }
        else if (campoModificado === 'precio_venta_caja') {
            // Usuario modificó el precio por caja manualmente
            setPrecioVentaManual('caja');
            if (precioVentaCaja > 0 && porCaja > 0) {
                nuevoForm.precio_venta = (precioVentaCaja / porCaja).toFixed(4);
            }
        }
        else if (campoModificado === 'cant_p_caja' && porCaja > 0) {
            // Si cambió cant_p_caja, recalcular basado en cuál fue el último modificado manualmente
            if (precioVentaManual === 'caja' && precioVentaCaja > 0) {
                nuevoForm.precio_venta = (precioVentaCaja / porCaja).toFixed(4);
            } else if ((precioVentaManual === 'unitario' || !precioVentaManual) && precioVentaUnitario > 0) {
                nuevoForm.precio_venta_caja = (precioVentaUnitario * porCaja).toFixed(2);
            }
        }

        return nuevoForm;
    };

    const handleFormChange = (newForm: any, campoModificado?: string) => {
        //   Si hay un campo modificado y es un precio de venta o cant_p_caja, calcular automáticamente
        if (campoModificado && ['precio_venta', 'precio_venta_caja', 'cant_p_caja'].includes(campoModificado)) {
            const formConCalculos = calcularPrecioVentaCaja(newForm, campoModificado);
            setForm(formConCalculos);
        } else {
            setForm(newForm);
        }
    };

    const handleCategoriaSelect = (categoria: any) => {
        setCategoriaSeleccionada(categoria);
        setForm(prev => ({ ...prev, idcategoria: categoria.idcategorias }));
    };

    const handleAgregar = (producto: any) => {
        onAgregar({ ...producto, imagenArchivo: imagenProducto });
        setImagenProducto(null);
        console.log("producto recibido", producto)

        // Resetear formulario
        setForm({
            nombre_producto: '',
            precio_compra: '',
            precio_compra_caja: '',
            cod_barra: '',
            precio_venta: '',
            precio_venta_caja: '',
            precio_venta_pack: '',
            unidad_medida: '',
            iva: '',
            idcategoria: '',
            cantidad: '0',
            cant_p_caja: '',
            cant_p_pack: '',
            cant_cajas: '',
            fecha_vencimiento: '',
            ubicacion: '',
            numero_lote: '01',
            referencia_proveedor: '',
            ubicacion_almacen: 'PRINCIPAL',
            principio_activo: '',
            laboratorio: '',
            receta: 'libre',
            stock_minimo: ''
        });
        setCategoriaSeleccionada(null);
        setOpcionSeleccionada("");
        setPrecioVentaManual(null); //   Resetear también esto
    };

    useEffect(() => {
        console.log("precioCompraTest", precioCompraTest)
        if (opcionSeleccionada === "caja_total") setForm(prev => ({ ...prev, precio_compra: precioCompraTest }));
    }, [opcionSeleccionada, precioCompraTest])

    // Reconocimiento por foto
    const [avisoFoto, setAvisoFoto] = useState('');

    const aplicarProductoDetectado = (detectado: ProductoDetectado, categoria: CategoriaEncontrada | null) => {
        const producto = normalizarAPack(detectado);
        const esCaja = producto.unidad_medida_sugerida === 'CAJA';
        setForm(prev => ({
            ...prev,
            nombre_producto: producto.nombre_producto || prev.nombre_producto,
            cod_barra: producto.cod_barra || prev.cod_barra,
            unidad_medida: producto.unidad_medida_sugerida,
            cant_p_caja: esCaja && producto.unidades_por_presentacion ? String(producto.unidades_por_presentacion) : '',
            cant_cajas: esCaja ? prev.cant_cajas : '',
            cant_p_pack: producto.unidades_por_pack ? String(producto.unidades_por_pack) : prev.cant_p_pack,
            principio_activo: producto.principio_activo || prev.principio_activo,
            laboratorio: producto.laboratorio || prev.laboratorio,
            precio_venta_caja: esCaja ? prev.precio_venta_caja : '',
            idcategoria: categoria ? String(categoria.idcategorias) : prev.idcategoria,
        }));
        if (categoria) setCategoriaSeleccionada(categoria);
        // Elegir CAJA a mano abre el paso "¿el costo es por caja o por
        // unidad?"; si la unidad viene de la foto hay que abrirlo igual para
        // no saltearlo.
        if (esCaja) setModalShowOptionCostBuy('CAJA');
        else { setModalShowOptionCostBuy(''); setOpcionSeleccionada(''); }
    };

    const handleProductoDetectado = (
        producto: ProductoDetectado,
        coincidencias: ProductoCoincidente[],
        categoria: CategoriaEncontrada | null,
    ) => {
        aplicarProductoDetectado(producto, categoria);
        const mejor = coincidencias[0];
        if (mejor && mejor.similitud >= 70) {
            setAvisoFoto(`Ojo: ya tenés "${mejor.nombre_producto}" en el inventario (${mejor.similitud}% de coincidencia, stock ${mejor.stock ?? '-'}).\n\nSi es el mismo producto, conviene cargarlo desde "Nueva Compra" → "Seleccionar producto" para no duplicarlo.`);
        }
    };

    useEffect(() => {
        if (productoInicial) aplicarProductoDetectado(productoInicial.producto, productoInicial.categoria);
        // Solo al abrir con datos precargados; no reaplicar en cada render.
    }, [productoInicial]);

    return (
        <div className="">
            {/* Contenedor Principal con diseño mejorado */}
            <div className="flex flex-col gap-4 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-gray-700 rounded-2xl overflow-x-clip pb-2">

                {/* Separador visual entre FormularioProducto1 y FormularioProducto2 */}
                <FormularioProducto1
                    codigosPendientes={(productosNuevos || []).map((p: any) => String(p.cod_barra ?? '').trim()).filter(Boolean)}
                    dataHeader={dataHeader}
                    form={form}
                    optionSelectedByBox={opcionSeleccionada}
                    setOpcionSeleccionada={setOpcionSeleccionada}
                    setModalShowOptionCostBuy={setModalShowOptionCostBuy}
                    onFormChange={handleFormChange}
                    categoriaSeleccionada={categoriaSeleccionada}
                    onCategoriaSelect={handleCategoriaSelect}
                    inicioPaso1={
                        <>
                            {productoInicial && form.nombre_producto && (
                                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300 space-y-0.5">
                                    <p>Datos completados desde la foto. Revisalos y cargá precios y cantidad.</p>
                                    {!productoInicial.categoria && productoInicial.producto.categoria_sugerida && !categoriaSeleccionada && (
                                        <p className="text-amber-700 dark:text-amber-400">
                                            La IA sugirió la categoría "{productoInicial.producto.categoria_sugerida}", que no está en tu lista: elegí una o creala.
                                        </p>
                                    )}
                                </div>
                            )}
                            {IA_HABILITADA && (
<ReconocerProductoFoto
                                onDetectado={handleProductoDetectado}
                                onError={(msg) => setAvisoFoto(msg)}
                            />
)}
                        </>
                    }
                    imagenProducto={imagenProducto}
                    onImagenProductoChange={setImagenProducto}
                />

                {mostrarAvisoScroll && (
                    <div className="sticky top-16 z-20 -my-1 flex justify-end px-3 pointer-events-none">
                        <button
                            type="button"
                            onClick={() => document.getElementById('compra-rapida-campos-inventario')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                            className="pointer-events-auto inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200 bg-white/95 px-3 py-2 text-xs font-semibold text-blue-800 shadow-md backdrop-blur transition-all hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/95 dark:text-blue-300"
                            aria-label="Seguir bajando para ver los campos de inventario"
                        >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"><ChevronDown size={17} className="animate-bounce motion-reduce:animate-none" /></span>
                            <span>Seguir bajando para ver <strong>{form.unidad_medida === 'CAJA' ? 'cajas, lote y vencimiento' : 'pack, stock, lote y vencimiento'}</strong></span>
                        </button>
                    </div>
                )}

                <FormularioProducto2
                    productosNuevos={productosNuevos}
                    onProcesoCompraChange={onShowModalConfirm}    
                    opcionSeleccionada={opcionSeleccionada}
                    setOpcionSeleccionada={setOpcionSeleccionada}
                    setModalShowOptionCostBuy={setModalShowOptionCostBuy}
                    setPrecioCompraTest={setPrecioCompraTest}
                    form={form}
                    modalShowOptionCostBuy={modalShowOptionCostBuy}
                    onFormChange={handleFormChange}
                    onAgregar={handleAgregar}
                />

            </div>

            <ModalAdvert
                isOpen={!!avisoFoto}
                onClose={() => setAvisoFoto('')}
                message={avisoFoto}
                confirmButtonText="Entendido"
                onConfirm={() => setAvisoFoto('')}
            />
        </div>
    );
};

export default FormularioProducto;
