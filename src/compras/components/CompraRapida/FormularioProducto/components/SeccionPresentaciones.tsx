import { useState } from 'react';
import { NumericFormat } from 'react-number-format';
import { FaBox, FaBoxOpen, FaCube, FaLightbulb } from 'react-icons/fa';

interface Props {
    form: any;
    onFormChange: (form: any) => void;
}

const gs = (n: number) => `Gs. ${Math.round(n).toLocaleString('es-PY')}`;
const num = (v: unknown) => parseFloat(String(v ?? '').replace(',', '.')) || 0;

/**
 * "¿Cómo se vende?": deja claro qué es cada presentación (unidad suelta, pack/blíster/paquete y caja), muestra cuánto
 * trae cada una y qué va a ver el cajero en la venta. Pensado para farmacias y negocios que venden por caja, por
 * blíster y por unidad suelta.
 */
export default function SeccionPresentaciones({ form, onFormChange }: Props) {
    const [verEjemplo, setVerEjemplo] = useState(false);
    const esCaja = form.unidad_medida === 'CAJA';
    const porCaja = num(form.cant_p_caja);
    const porPack = num(form.cant_p_pack);
    const precioUnidad = num(form.precio_venta);
    const precioPack = num(form.precio_venta_pack);
    const precioCaja = num(form.precio_venta_caja);

    const sugerido = porPack > 0 && precioUnidad > 0 ? precioUnidad * porPack : 0;
    const packMayorQueCaja = esCaja && porCaja > 0 && porPack > porCaja;
    const sobran = esCaja && porCaja > 0 && porPack > 0 && !packMayorQueCaja ? porCaja % porPack : 0;

    const caja = 'rounded-xl border-2 p-3';
    const input = 'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100';

    return (
        <section aria-label="Cómo se vende" id="compra-rapida-campos-inventario" className="mx-2 mb-3 rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-sky-50 p-3 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h4 className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200">¿Cómo se vende? · Presentaciones</h4>
                    <p className="text-xs text-slate-600 dark:text-gray-400">Siempre se puede vender por unidad suelta. Si también lo vendés por caja, blíster o paquete, cargalo como pack.</p>
                </div>
                <button type="button" onClick={() => setVerEjemplo((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:border-gray-600 dark:bg-gray-700 dark:text-indigo-300">
                    <FaLightbulb aria-hidden="true" /> {verEjemplo ? 'Ocultar ejemplo' : 'Ver ejemplo'}
                </button>
            </div>

            {verEjemplo && (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-100">
                    <p className="font-bold">Ejemplo de farmacia: caja de 30 comprimidos</p>
                    <ul className="mt-1 list-disc pl-5">
                        <li><strong>Unidad:</strong> dejá «Unidad». El precio de un comprimido es el «P. Venta und.» de arriba.</li>
                        <li><strong>Pack:</strong> escribí <strong>30</strong> unidades y el precio de la caja. Si en vez de la caja vendés el blíster, escribí 10 y el precio del blíster.</li>
                        <li>En la venta, el cajero elige si vende el pack o comprimidos sueltos.</li>
                    </ul>
                </div>
            )}

            <div className={`grid gap-3 ${esCaja ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                <div className={`${caja} border-emerald-200 bg-white dark:border-emerald-800/50 dark:bg-gray-800`}>
                    <p className="flex items-center gap-2 text-sm font-extrabold text-emerald-700 dark:text-emerald-300"><FaBoxOpen aria-hidden="true" /> Unidad suelta</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">Siempre disponible. Es la unidad más chica (un comprimido, una botella).</p>
                    <p className="mt-2 text-sm font-bold text-slate-800 dark:text-gray-100">{precioUnidad > 0 ? gs(precioUnidad) : 'Falta el precio de venta (arriba)'}</p>
                </div>

                <div className={`${caja} border-violet-200 bg-white dark:border-violet-800/50 dark:bg-gray-800`}>
                    <p className="flex items-center gap-2 text-sm font-extrabold text-violet-700 dark:text-violet-300"><FaCube aria-hidden="true" /> Pack (caja, blíster, paquete) <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-gray-700 dark:text-gray-300">opcional</span></p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">Un grupo de unidades que se vende junto (ej.: caja de 30 o blíster de 10).</p>
                    <label className="mt-2 block text-xs font-semibold text-slate-700 dark:text-gray-300">¿Cuántas unidades trae?
                        <NumericFormat
                            data-campo="cant_p_pack"
                            value={form.cant_p_pack}
                            thousandSeparator="."
                            decimalSeparator=","
                            decimalScale={0}
                            allowNegative={false}
                            placeholder="Ej: 10"
                            onValueChange={(v) => onFormChange({ ...form, cant_p_pack: v.value || '' })}
                            className={`mt-1 ${input}`}
                        />
                    </label>
                    <label className="mt-2 block text-xs font-semibold text-slate-700 dark:text-gray-300">Precio de venta del pack
                        <NumericFormat
                            data-campo="precio_venta_pack"
                            value={form.precio_venta_pack}
                            thousandSeparator="."
                            decimalSeparator=","
                            decimalScale={0}
                            allowNegative={false}
                            prefix="₲ "
                            placeholder={sugerido > 0 ? `Sugerido ${gs(sugerido)}` : 'Ej: 12.000'}
                            onValueChange={(v) => onFormChange({ ...form, precio_venta_pack: v.value || '' })}
                            className={`mt-1 ${input}`}
                        />
                    </label>
                    {sugerido > 0 && precioPack !== sugerido && (
                        <button type="button" onClick={() => onFormChange({ ...form, precio_venta_pack: String(Math.round(sugerido)) })} className="mt-1.5 text-xs font-bold text-violet-700 underline hover:text-violet-900 dark:text-violet-300">
                            Usar {gs(sugerido)} ({porPack} × {gs(precioUnidad)})
                        </button>
                    )}
                </div>

                {esCaja && <div className={`${caja} border-sky-300 bg-white dark:border-sky-700/60 dark:bg-gray-800`}>
                    <p className="flex items-center gap-2 text-sm font-extrabold text-sky-700 dark:text-sky-300"><FaBox aria-hidden="true" /> Caja</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">Viene en cajas con varias unidades adentro.</p>
                    <p className="mt-2 text-sm font-bold text-slate-800 dark:text-gray-100">{porCaja > 0 ? `${porCaja} unidades por caja` : 'Falta «Unidades por caja»'}</p>
                    <p className="text-xs text-slate-600 dark:text-gray-300">{precioCaja > 0 ? `Precio de la caja: ${gs(precioCaja)}` : 'El precio de la caja se calcula solo con las unidades y el precio por unidad.'}</p>
                </div>}
            </div>

            {(porPack > 0 || porCaja > 0) && (
                <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-gray-800/70 dark:text-gray-200" role="status">
                    En la venta se podrá elegir:
                    <span className="ml-1">Unidad{precioUnidad > 0 ? ` (${gs(precioUnidad)})` : ''}</span>
                    {porPack > 1 && <span> · Pack de {porPack}{precioPack > 0 ? ` (${gs(precioPack)})` : ''}</span>}
                    {esCaja && porCaja > 0 && <span> · Caja de {porCaja}{precioCaja > 0 ? ` (${gs(precioCaja)})` : ''}</span>}
                </p>
            )}
            {packMayorQueCaja && (
                <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900" role="alert">El pack ({porPack}) trae más unidades que la caja ({porCaja}). Revisá los números.</p>
            )}
            {sobran > 0 && (
                <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900" role="status">Una caja de {porCaja} no se reparte justo en packs de {porPack}: sobrarían {sobran} unidades sueltas. Si es correcto, seguí.</p>
            )}
        </section>
    );
}
