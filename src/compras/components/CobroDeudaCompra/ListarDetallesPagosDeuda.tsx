'use client';

import { useCallback, useEffect, useState } from 'react';
import { FaSearch, FaTrash } from 'react-icons/fa';
import ModalAdvert from '../../../components/ModalAdvert';
import ModalSuccess from '../../../components/ModalSuccess';
import ModalError from '../../../components/ModalError';
import { fetchDetallesPago, anularPagoDeudaCompra } from '../../../services/compras';
import { formatPY } from '../../../movimiento/utils/utils';
import SelectPagination from '../../../components/SelectPagination';
import { AccionFila, TablaListado } from '../../../components/listado/Listado';

interface Props { iddeuda: number; onSuccess?: () => void; }

export default function ListarDetallesPagosDeuda({ iddeuda, onSuccess }: Props) {
  const [detalles, setDetalles] = useState<any[]>([]);
  const [showAdvert, setShowAdvert] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [idPagoAAnular, setIdPagoAAnular] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDetalles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchDetallesPago(iddeuda, page, search);
      setDetalles(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error al cargar detalles de pagos:', error);
      setErrorMessage('No se pudieron cargar los pagos de esta deuda.');
    } finally { setLoading(false); }
  }, [iddeuda, page, search]);

  useEffect(() => { fetchDetalles(); }, [fetchDetalles]);

  const confirmarAnulacion = async () => {
    if (idPagoAAnular === null) return;
    try {
      await anularPagoDeudaCompra(idPagoAAnular);
      setSuccessModalOpen(true);
      await fetchDetalles();
      onSuccess?.();
    } catch (error) {
      console.error('Error al anular el pago:', error);
      setErrorMessage('Error al anular el pago.');
    } finally { setShowAdvert(false); setIdPagoAAnular(null); }
  };

  return <section className="space-y-4">
    <header><h2 className="text-xl font-bold text-slate-900 dark:text-white">Historial de pagos</h2><p className="text-sm text-slate-500">Consulta y administra los pagos registrados para esta deuda.</p></header>
    <label className="relative block max-w-xl"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por observación, método o autor..." className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm dark:border-slate-600 dark:bg-gray-800 dark:text-white" /></label>
    <TablaListado
      columnas={[
        { clave: 'fecha', titulo: 'Fecha y hora', sinSalto: true, render: (p: any) => new Date(p.fecha_pago).toLocaleString('es-PY') },
        { clave: 'monto', titulo: 'Monto', alinear: 'right', sinSalto: true, render: (p: any) => formatPY(p.monto_pagado) },
        { clave: 'metodo', titulo: 'Método', render: (p: any) => p.metodo_pago || '—' },
        { clave: 'observacion', titulo: 'Observación', render: (p: any) => p.observacion || '—' },
      ]}
      filas={detalles} claveFila={(p: any) => p.idpago_deuda_compra} cargando={loading}
      vacio={search ? 'No se encontraron pagos con ese criterio.' : 'No hay pagos registrados.'}
      acciones={(p: any) => <AccionFila onClick={() => { setIdPagoAAnular(p.idpago_deuda_compra); setShowAdvert(true); }} icono={<FaTrash />} texto="Anular" tipo="peligro" />}
    />
    <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
    <ModalAdvert isOpen={showAdvert} onClose={() => setShowAdvert(false)} onConfirm={confirmarAnulacion} message="¿Anular este pago? El saldo de la deuda se actualizará." confirmButtonText="Sí, anular" />
    <ModalSuccess isOpen={successModalOpen} onClose={() => setSuccessModalOpen(false)} message="Pago anulado correctamente." />
    <ModalError isOpen={!!errorMessage} onClose={() => setErrorMessage('')} message={errorMessage} />
  </section>;
}
