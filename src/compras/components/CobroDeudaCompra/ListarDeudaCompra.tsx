'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaMoneyBillWave, FaShoppingBag } from 'react-icons/fa';
import { fetchDeudasCompra } from '../../../services/compras';
import SelectPage from '../../../components/SelectPage';
import SelectPagination from '../../../components/SelectPagination';
import SearchActionsBar from '../../../components/SearchActionsBar';
import ButtonGral from '../../../components/ButtonGral';
import { AccionFila, Insignia, TablaListado } from '../../../components/listado/Listado';
import { useAlVolverALaVentana } from '../../../hooks/useAlVolverALaVentana';

const moneda = (valor: unknown) => `Gs. ${Math.round(Number(valor) || 0).toLocaleString('es-PY')}`;
const fecha = (valor: string) => valor ? new Date(valor).toLocaleDateString('es-PY') : '—';

export default function ListarDeudasCompra() {
  const navigate = useNavigate();
  const [deudas, setDeudas] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchDeudas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchDeudasCompra(page, limit, search);
      setDeudas(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Error al obtener deudas de compras:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => { fetchDeudas(); }, [fetchDeudas]);
  useAlVolverALaVentana(fetchDeudas);

  const abrirPago = (deuda: any) => {
    sessionStorage.setItem('deuda-compra-actual', JSON.stringify({
      id: deuda.iddeuda_compra,
      montoMaximo: Number(deuda.saldo ?? (deuda.total_deuda - deuda.total_pagado)),
    }));
    navigate(`/compras/cobrodeuda/pagar/${deuda.iddeuda_compra}`);
  };

  const abrirPagos = (id: number) => navigate(`/compras/cobrodeuda/pagos/${id}`);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 dark:bg-gray-900 sm:px-6" style={{ scrollbarGutter: 'stable' }}>
      <div className="mx-auto w-full max-w-[1800px]">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><FaShoppingBag /></span>
          <div><h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Pagos de compras a crédito</h1><p className="text-sm text-slate-500">Saldos pendientes con proveedores</p></div>
        </div>
        <SearchActionsBar searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Buscar por proveedor o estado...">
          <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
          <ButtonGral text="Ver reporte" onClick={() => abrirPagos(0)} />
        </SearchActionsBar>
        <TablaListado
          columnas={[
            { clave: 'proveedor', titulo: 'Proveedor', render: (d: any) => <span className="font-semibold">{d.nombre}</span> },
            { clave: 'deuda', titulo: 'Total deuda', alinear: 'right', sinSalto: true, render: (d: any) => moneda(d.total_deuda) },
            { clave: 'pagado', titulo: 'Total pagado', alinear: 'right', sinSalto: true, render: (d: any) => moneda(d.total_pagado) },
            { clave: 'saldo', titulo: 'Saldo', alinear: 'right', sinSalto: true, render: (d: any) => <span className="font-bold text-red-600">{moneda(d.saldo)}</span> },
            { clave: 'fecha', titulo: 'Fecha', sinSalto: true, render: (d: any) => fecha(d.fecha_deuda) },
            { clave: 'estado', titulo: 'Estado', render: (d: any) => <Insignia color={String(d.estado).toLowerCase() === 'pendiente' ? 'ambar' : 'verde'}>{String(d.estado || '').toUpperCase()}</Insignia> },
          ]}
          filas={deudas}
          claveFila={(d: any) => d.iddeuda_compra}
          cargando={loading}
          vacio={search ? 'No se encontraron deudas con ese criterio' : 'No hay deudas registradas'}
          acciones={(d: any) => <><AccionFila onClick={() => abrirPago(d)} icono={<FaMoneyBillWave />} texto="Pagar" /><AccionFila onClick={() => abrirPagos(d.iddeuda_compra)} icono={<FaEye />} texto="Ver pagos" tipo="neutra" /></>}
        />
        <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
      </div>
    </div>
  );
}
