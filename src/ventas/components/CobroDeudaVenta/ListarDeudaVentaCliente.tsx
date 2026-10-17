'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInfoCircle, FaMoneyBill } from 'react-icons/fa';
import { listarDeudasClienteConCuotasDetalle } from '../../../services/ventas';
import ButtonGral from '../../../components/ButtonGral';
import SearchActionsBar from '../../../components/SearchActionsBar';
import SelectPage from '../../../components/SelectPage';
import SelectPagination from '../../../components/SelectPagination';
import { AccionFila, Insignia, TablaListado } from '../../../components/listado/Listado';
import { formatPY } from '../../../movimiento/utils/utils';
import { useAlVolverALaVentana } from '../../../hooks/useAlVolverALaVentana';

export default function ListarDeudasVentaCliente() {
  const navigate = useNavigate();
  const [deudas, setDeudas] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [loading, setLoading] = useState(false);

  const fetchDeudas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listarDeudasClienteConCuotasDetalle({ page, limit, search, order });
      setDeudas(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) { console.error('Error al obtener deudas de ventas:', error); }
    finally { setLoading(false); }
  }, [page, limit, search, order]);

  useEffect(() => { fetchDeudas(); }, [fetchDeudas]);
  useAlVolverALaVentana(fetchDeudas);

  const verDetalles = (deuda: any) => {
    const cliente = { idcliente: deuda.idcliente, nombreCompleto: deuda.nombre_cliente, numDocumento: deuda.numDocumento };
    sessionStorage.setItem('deuda-venta-cliente-actual', JSON.stringify(cliente));
    navigate(`/ventas/cobrodeuda/cliente/${deuda.idcliente}`);
  };

  return <div className="min-h-screen bg-slate-50 px-4 py-5 dark:bg-gray-900 sm:px-6" style={{ scrollbarGutter: 'stable' }}>
    <div className="mx-auto w-full max-w-[1800px]">
      <div className="mb-3 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><FaMoneyBill /></span><div><h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Cobros de ventas a crédito</h1><p className="text-sm text-slate-500">Saldos agrupados por cliente</p></div></div>
      <SearchActionsBar searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Buscar por cliente o documento...">
        <ButtonGral text={order === 'DESC' ? 'Mayor saldo primero' : 'Menor saldo primero'} onClick={() => { setOrder(order === 'DESC' ? 'ASC' : 'DESC'); setPage(1); }} />
        <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
      </SearchActionsBar>
      <TablaListado
        columnas={[
          { clave: 'cliente', titulo: 'Cliente', render: (d: any) => <span className="font-semibold">{d.nombre_cliente}</span> },
          { clave: 'documento', titulo: 'Documento', render: (d: any) => d.numDocumento || '—' },
          { clave: 'deuda', titulo: 'Total deuda', alinear: 'right', sinSalto: true, render: (d: any) => formatPY(d.total_deuda) },
          { clave: 'pagado', titulo: 'Total pagado', alinear: 'right', sinSalto: true, render: (d: any) => formatPY(d.total_pagado) },
          { clave: 'saldo', titulo: 'Saldo', alinear: 'right', sinSalto: true, render: (d: any) => <span className="font-bold text-red-600">{formatPY(d.saldo)}</span> },
          { clave: 'estado', titulo: 'Estado', render: (d: any) => <Insignia color={Number(d.saldo) > 0 ? 'ambar' : 'verde'}>{Number(d.saldo) > 0 ? 'PENDIENTE' : 'PAGADO'}</Insignia> },
        ]}
        filas={deudas} claveFila={(d: any) => d.idcliente ?? d.iddeuda} cargando={loading}
        vacio={search ? 'No se encontraron clientes con ese criterio.' : 'No hay deudas de ventas registradas.'}
        acciones={(d: any) => <AccionFila onClick={() => verDetalles(d)} icono={<FaInfoCircle />} texto="Ver detalles" />}
      />
      <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
    </div>
  </div>;
}
