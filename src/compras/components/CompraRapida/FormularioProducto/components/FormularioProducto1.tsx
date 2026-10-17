'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { NumericFormat } from "react-number-format";
import ModalSeleccionarCategoria from '../../../../../productos/components/ModalsProductos/ModalSeleccionarCategoria';
import { Search, CheckCircle2, Camera } from 'lucide-react';
import { getProductosPaginated } from '../../../../../services/productos';
import DatosFarmaciaProducto from '../../../../../components/DatosFarmaciaProducto';
import { styleforStep, styleforStepBox, styleTitleBox } from '../utils/style';
import BotonGenerarCodigoBarra from '../../../../../components/BotonGenerarCodigoBarra';

interface FormData {
    nombre_producto: string;
    precio_compra: string;
    precio_compra_caja: string;
    cod_barra: string;
    precio_venta: string;
    precio_venta_caja: string;
    unidad_medida: string;
    iva: string;
    idcategoria: string;
    cantidad: string;
    cant_p_caja: string;
    cant_cajas: string;
    fecha_vencimiento: string;
    ubicacion: string;
    numero_lote: string;
    referencia_proveedor: string;
    ubicacion_almacen: string;
    principio_activo?: string;
    laboratorio?: string;
    receta?: string;
    stock_minimo?: string;
}

interface Props {
    /** Códigos de barras de los productos nuevos ya agregados (para que el generador no los repita). */
    codigosPendientes?: string[];
    optionSelectedByBox?: string;
    setOpcionSeleccionada: (value: string) => void;
    setModalShowOptionCostBuy: (value: string) => void;
    form: FormData;
    onFormChange: (form: FormData, campo?: string) => void;
    categoriaSeleccionada: any;
    onCategoriaSelect: (categoria: any) => void;
    dataHeader?: {
        totalProductos: number;
        totalCantidad: number;
        totalValor: number;
    };
    // Contenido extra al inicio del Paso 1 (ej. "Completar con una foto"),
    // junto a los datos que ese contenido completa.
    inicioPaso1?: ReactNode;
    imagenProducto?: File | null;
    onImagenProductoChange?: (imagen: File | null) => void;
}

const FormularioProducto1 = ({ codigosPendientes, dataHeader, setOpcionSeleccionada, optionSelectedByBox, setModalShowOptionCostBuy, form, onFormChange, categoriaSeleccionada, onCategoriaSelect, inicioPaso1, imagenProducto, onImagenProductoChange }: Props) => {
    const [showCategoriaModal, setShowCategoriaModal] = useState(false);
    const [porcentajeGanancia, setPorcentajeGanancia] = useState('');
    const [imagenPreview, setImagenPreview] = useState('');
    useEffect(() => {
        if (!imagenProducto) { setImagenPreview(''); return; }
        const url = URL.createObjectURL(imagenProducto);
        setImagenPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [imagenProducto]);

    const handlePorcentajeChange = (value: string) => {
        setPorcentajeGanancia(value);
        const precioCompra = parseFloat(
            (optionSelectedByBox === 'caja_total' ? form.precio_compra_caja : form.precio_compra) || '0'
        );
        const pct = parseFloat(value || '0');
        if (precioCompra > 0 && pct > 0) {
            const precioVenta = precioCompra * (1 + pct / 100);
            onFormChange({ ...form, precio_venta: precioVenta.toFixed(2) }, 'precio_venta');
        }
    };

    const [validando, setValidando] = useState<'nombre_producto' | 'cod_barra' | null>(null);
    const [resultadoVerif, setResultadoVerif] = useState<{ campo: string; existe: boolean; texto: string } | null>(null);

    /** Busca un producto ya cargado con el mismo nombre o código de barras, para no duplicarlo. */
    const verificarDuplicado = async (campo: 'nombre_producto' | 'cod_barra') => {
        const termino = (form[campo] || '').trim();
        if (!termino) return;
        setValidando(campo); setResultadoVerif(null);
        try {
            const res = await getProductosPaginated({ page: 1, limit: 5, search: termino });
            const lista: any[] = res.data?.data || [];
            const e = lista.find((p) => (campo === 'cod_barra' ? String(p.cod_barra ?? '').trim() === termino : String(p.nombre_producto || '').toLowerCase() === termino.toLowerCase()));
            setResultadoVerif(e
                ? { campo, existe: true, texto: `Ya existe: ${e.nombre_producto} (stock ${e.stock ?? '-'}, venta ₲ ${Number(e.precio_venta || 0).toLocaleString('es-PY')}). Cargá una compra de ese producto en lugar de crear otro.` }
                : { campo, existe: false, texto: campo === 'cod_barra' ? 'Código disponible: no hay otro producto con él.' : 'Nombre disponible: no hay otro producto igual.' });
        } catch {
            setResultadoVerif({ campo, existe: true, texto: 'No se pudo verificar. Revisá la conexión e intentá de nuevo.' });
        } finally { setValidando(null); }
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;

        if (name === 'unidad_medida' && value === 'CAJA') {
            setModalShowOptionCostBuy("CAJA");
        } else if (name === 'unidad_medida' && value !== 'CAJA') {
            setModalShowOptionCostBuy("");
            setOpcionSeleccionada("");
        }

        let formActualizado = {
            ...form,
            [name]: value
        };

        // Limpiar campos específicos de cajas cuando no sea CAJA
        if (name === 'unidad_medida' && value !== 'CAJA') {
            formActualizado = {
                ...formActualizado,
                cant_cajas: '',
                cant_p_caja: '',
                precio_venta_caja: ''
            };
        }

        onFormChange(formActualizado);
    };

    const handleNumericChange = (field: keyof FormData, value: string) => {
        const formActualizado = {
            ...form,
            [field]: value
        };
        //   IMPORTANTE: Pasar el campo modificado como segundo parámetro
        onFormChange(formActualizado, field);
    };


    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-3 py-2.5 dark:border-gray-700">
                <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-gray-100">Información del producto</h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Completá los datos y agregalo a la compra</p>
                </div>
                {(dataHeader?.totalProductos ?? 0) > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                            {dataHeader?.totalProductos} producto{dataHeader?.totalProductos === 1 ? '' : 's'}
                        </span>
                        <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {dataHeader?.totalCantidad} unidades · ₲ {dataHeader?.totalValor?.toLocaleString('es-PY')}
                        </span>
                    </div>
                )}
            </div>
            {/* Sección 1: Datos Básicos */}
            <div className='flex flex-row gap-4 px-2'>
                <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-2 border border-blue-100 dark:border-gray-700">
                    <div className={styleforStep}>
                        <div className="bg-blue-500 text-white rounded-lg px-3 py-1 text-sm font-bold shadow-md">
                            PASO 1
                        </div>
                        <h4 className={styleTitleBox}>Datos Básicos</h4>
                    </div>

            {inicioPaso1 && (
                <section className="mb-3 rounded-lg border border-slate-200 bg-white/80 p-2.5 dark:border-gray-700 dark:bg-gray-800/70">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <div>
                            <p className="text-xs font-semibold text-slate-700 dark:text-gray-200">Foto del producto</p>
                            <p className="text-[11px] text-slate-500 dark:text-gray-400">Usá una imagen para completar los datos más rápido</p>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">Opcional</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900">
                            {imagenProducto ? (
                                <img src={imagenPreview} alt="Vista previa del producto" className="h-12 w-12 rounded-md border border-slate-200 object-cover" />
                            ) : (
                                <span className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><Camera size={18} /></span>
                            )}
                            <span className="min-w-0">
                                <span className="block text-xs font-semibold text-slate-700 dark:text-gray-200">{imagenProducto?.name || 'Agregar foto del producto'}</span>
                                <span className="block text-[11px] text-slate-500">JPG, PNG o WEBP · máximo 8 MB</span>
                            </span>
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => {
                                const archivo = e.target.files?.[0];
                                e.target.value = '';
                                if (!archivo) return;
                                if (archivo.size > 8 * 1024 * 1024) { window.alert('La imagen supera los 8 MB.'); return; }
                                onImagenProductoChange?.(archivo);
                            }} />
                        </label>
                        {imagenProducto && <button type="button" onClick={() => onImagenProductoChange?.(null)} className="text-xs font-medium text-rose-600 hover:underline">Quitar foto</button>}
                    </div>
                    <div className="mt-2 space-y-2">{inicioPaso1}</div>
                </section>
            )}

                    <div className={styleforStepBox}>
                        <div className='flex flex-col gap-3'>
                            <div className="">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                    Nombre del Prod. <span className="text-rose-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                    type="text"
                                    name="nombre_producto"
                                    value={form.nombre_producto}
                                    onChange={(e) => { handleChange(e); setResultadoVerif(null); }}
                                    placeholder="Ej: Coca Cola 2L"
                                    className="flex-1 min-w-0 bg-white dark:bg-gray-700 border-2 border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
                                />
                                    <button type="button" onClick={() => verificarDuplicado('nombre_producto')} disabled={validando !== null || !(form.nombre_producto || '').trim()} title="Verificar si el producto ya existe"
                                        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-500 px-3 text-xs font-bold text-white transition hover:bg-amber-600 disabled:bg-gray-300">
                                        <Search size={13} /> {validando === 'nombre_producto' ? '...' : 'Verificar'}
                                    </button>
                                </div>
                                {resultadoVerif?.campo === 'nombre_producto' && (
                                    <p className={`mt-1.5 flex items-start gap-1.5 text-xs font-medium ${resultadoVerif.existe ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {!resultadoVerif.existe && <CheckCircle2 size={14} className="mt-px shrink-0" />} {resultadoVerif.texto}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                    Cód. de Barr.
                                </label>
                                <div className="flex gap-2">
                                    <input
                                    type="text"
                                    name="cod_barra"
                                    value={form.cod_barra}
                                    onChange={(e) => { handleChange(e); setResultadoVerif(null); }}
                                    placeholder="7891000053508"
                                    className="flex-1 min-w-0 bg-white dark:bg-gray-700 border-2 border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
                                />
                                    <BotonGenerarCodigoBarra
                                        evitar={[...(codigosPendientes || []), form.cod_barra || ''].filter(Boolean)}
                                        onCodigo={(c) => { onFormChange({ ...form, cod_barra: c }, 'cod_barra'); setResultadoVerif(null); }}
                                        className="py-3"
                                    />
                                    <button type="button" onClick={() => verificarDuplicado('cod_barra')} disabled={validando !== null || !(form.cod_barra || '').trim()} title="Verificar si el producto ya existe"
                                        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-500 px-3 text-xs font-bold text-white transition hover:bg-amber-600 disabled:bg-gray-300">
                                        <Search size={13} /> {validando === 'cod_barra' ? '...' : 'Verificar'}
                                    </button>
                                </div>
                                {resultadoVerif?.campo === 'cod_barra' && (
                                    <p className={`mt-1.5 flex items-start gap-1.5 text-xs font-medium ${resultadoVerif.existe ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {!resultadoVerif.existe && <CheckCircle2 size={14} className="mt-px shrink-0" />} {resultadoVerif.texto}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className='flex flex-col gap-3'>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                    Categoría <span className="text-rose-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    data-campo="idcategoria"
                                    onClick={() => setShowCategoriaModal(true)}
                                    className="w-full bg-white dark:bg-gray-700 border-2 border-blue-300 dark:border-blue-600 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-600 hover:border-blue-400 text-left focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-500 truncate transition-all shadow-sm hover:shadow-md"
                                >
                                    {categoriaSeleccionada ? categoriaSeleccionada.categoria : 'Seleccionar Categoría'}
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                    Ubicación
                                </label>
                                <input
                                    type="text"
                                    name="ubicacion"
                                    value={form.ubicacion}
                                    onChange={handleChange}
                                    placeholder="Estante A1"
                                    className="w-full bg-white dark:bg-gray-700 border-2 border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
                                />
                            </div>
                        </div>
                    </div>
                    <DatosFarmaciaProducto className="mt-2" valores={form} onCambio={(campo, valor) => onFormChange({ ...form, [campo]: valor })} />
                </div>

                {/* Sección 2: Precios y Configuración */}
                <div className="w-full bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-2 border border-emerald-200 dark:border-gray-700">
                    <div className={styleforStep}>
                        <div className="bg-emerald-500 text-white rounded-lg px-3 py-1 text-sm font-bold shadow-md truncate">
                            PASO 2
                        </div>
                        <h4 className={styleTitleBox}>Precios y Configuración</h4>
                    </div>

                    <div className='flex flex-col gap-3'>
                        <div className={styleforStepBox}>
                            <div className='flex flex-col gap-3'>
                                {/* Unidad de Medida */}
                                <div className='w-full'>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                        Unidad <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        name="unidad_medida"
                                        value={form.unidad_medida}
                                        onChange={handleChange}
                                        className="truncate mt-1 w-full bg-white dark:bg-gray-700 border-2 border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-500 transition-all shadow-sm hover:shadow-md cursor-pointer"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="KG">Kilogramo</option>
                                        <option value="UNIDAD">Unidad</option>
                                        {form.unidad_medida === 'PAQUETE' && <option value="PAQUETE">Paquete</option>}
                                        {form.unidad_medida === 'CAJA' && <option value="CAJA">Caja</option>}
                                        <option value="LITRO">Litro</option>
                                    </select>
                                </div>

                                {/* IVA */}
                                <div className='w-full'>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                        IVA <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        name="iva"
                                        value={form.iva}
                                        onChange={handleChange}
                                        className="truncate mt-2 w-full bg-white dark:bg-gray-700 border-2 border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-500 transition-all shadow-sm hover:shadow-md cursor-pointer"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="0">Exenta (0%)</option>
                                        <option value="5">5%</option>
                                        <option value="10">10%</option>
                                    </select>
                                </div>
                            </div>
                            <div className='flex flex-col gap-3'>
                                {/* Precio de Compra */}
                                <div className='w-full'>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 truncate">
                                        {optionSelectedByBox === "caja_total" ? "P. Compra Caja*" : "P. Compra und.*"}
                                    </label>
                                    <NumericFormat
                                        value={optionSelectedByBox === "caja_total" ? form.precio_compra_caja : form.precio_compra}
                                        thousandSeparator="."
                                        decimalSeparator=","
                                        decimalScale={2}
                                        fixedDecimalScale={false}
                                        allowNegative={false}
                                        onValueChange={(values) => {
                                            handleNumericChange(optionSelectedByBox === "caja_total" ? 'precio_compra_caja' : 'precio_compra', values.value || '');
                                        }}
                                        data-campo="precio_compra"
                                        placeholder="0,00"
                                        className="w-full bg-white dark:bg-gray-700 border-2 border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
                                    />
                                </div>

                                {/* % Ganancia → calcula P. Venta */}
                                <div className='w-full'>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 truncate">
                                        % Ganancia
                                    </label>
                                    <NumericFormat
                                        value={porcentajeGanancia}
                                        thousandSeparator="."
                                        decimalSeparator=","
                                        decimalScale={2}
                                        fixedDecimalScale={false}
                                        allowNegative={false}
                                        onValueChange={(values) => handlePorcentajeChange(values.value || '')}
                                        placeholder="Ej: 30"
                                        suffix=" %"
                                        className="w-full bg-white dark:bg-gray-700 border-2 border-violet-300 dark:border-violet-600 rounded-xl px-4 py-3 text-sm font-bold text-violet-700 dark:text-violet-400 placeholder-slate-400 dark:placeholder-gray-400 focus:ring-4 focus:ring-violet-200 dark:focus:ring-violet-800 focus:border-violet-500 transition-all shadow-sm hover:shadow-md"
                                    />
                                </div>

                                {/* Precio de Venta Unitario */}
                                <div className='w-full'>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 truncate">
                                        {form.unidad_medida === 'CAJA' ? 'P. Venta und.*' : 'P. Venta*'}
                                    </label>
                                    <NumericFormat
                                        value={form.precio_venta}
                                        thousandSeparator="."
                                        decimalSeparator=","
                                        decimalScale={2}
                                        fixedDecimalScale={false}
                                        allowNegative={false}
                                        onValueChange={(values) => {
                                            handleNumericChange('precio_venta', values.value || '');
                                        }}
                                        data-campo="precio_venta"
                                        placeholder="0,00"
                                        className="w-full bg-white dark:bg-gray-700 border-2 border-emerald-300 dark:border-emerald-600 rounded-xl px-4 py-3 text-sm font-bold text-emerald-700 dark:text-emerald-400 placeholder-slate-400 dark:placeholder-gray-400 focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-800 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md"
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Precio de Venta por Caja */}
                        {form.unidad_medida === 'CAJA' ? (
                            <div className=''>
                                <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                    P. Venta Caja
                                </label>
                                <NumericFormat
                                    value={form.precio_venta_caja}
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    decimalScale={2}
                                    fixedDecimalScale={false}
                                    allowNegative={false}
                                    onValueChange={(values) => {
                                        handleNumericChange('precio_venta_caja', values.value || '');
                                    }}
                                    placeholder="0,00"
                                    className="w-full mt-1 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 border-2 border-emerald-300 dark:border-emerald-600 rounded-xl px-4 py-3 text-sm font-bold text-emerald-700 dark:text-emerald-400 placeholder-slate-400 dark:placeholder-gray-400 focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-800 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md"
                                />
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1.5">Cálculo automático</p>
                            </div>
                        ) : (
                            <div className="hidden lg:block"></div>
                        )}
                    </div>
                </div>

            </div>

            {/* Modal de Categoría */}
            <ModalSeleccionarCategoria
                isOpen={showCategoriaModal}
                onClose={() => setShowCategoriaModal(false)}
                onSelect={(categoria: any) => {
                    onCategoriaSelect(categoria);
                    setShowCategoriaModal(false);
                }}
            />
        </>
    );
};

export default FormularioProducto1;
