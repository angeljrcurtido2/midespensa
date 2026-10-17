'use client';

import { useEffect, useState } from 'react';
import { useAlVolverALaVentana } from '../../../hooks/useAlVolverALaVentana';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import ModalError from '../../../components/ModalError';
import { listarArqueosPaginado } from '../../../services/arqueo';

interface Arqueo {
  idarqueo: number;
  total: number;
  idmovimiento: number;
  num_caja: string;
  fecha_apertura: string;
  estado: string;
  login: string;
}

const ListarArqueosCaja = () => {
  const [arqueos, setArqueos] = useState<Arqueo[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchArqueos = async () => {
    try {
      const res = await listarArqueosPaginado({ page, limit, search });
      setArqueos(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setErrorMessage('  Error al obtener arqueos');
      setErrorOpen(true);
    }
  };

  useAlVolverALaVentana(() => { void fetchArqueos(); });

  useEffect(() => {
    fetchArqueos();
  }, [page, limit, search]);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white py-10 px-6">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-lg p-8 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <ClipboardDocumentListIcon className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Arqueos de Caja</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <input
              type="text"
              placeholder="🔍 Buscar por número de caja, usuario, estado..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-[300px] px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-indigo-100 text-indigo-800 font-semibold text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left border-b">#</th>
                <th className="px-4 py-2 text-left border-b">Caja</th>
                <th className="px-4 py-2 text-left border-b">Usuario</th>
                <th className="px-4 py-2 text-left border-b">Fecha Apertura</th>
                <th className="px-4 py-2 text-right border-b">Total</th>
                <th className="px-4 py-2 text-center border-b">Estado</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {arqueos.map((arqueo, idx) => (
                <tr key={arqueo.idarqueo} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">{(page - 1) * limit + idx + 1}</td>
                  <td className="px-4 py-2 border-b">{arqueo.num_caja}</td>
                  <td className="px-4 py-2 border-b">{arqueo.login}</td>
                  <td className="px-4 py-2 border-b">
                    {new Date(arqueo.fecha_apertura).toLocaleString('es-ES')}
                  </td>
                  <td className="px-4 py-2 border-b text-right">{arqueo.total.toLocaleString('es-PY')} Gs</td>
                  <td className="px-4 py-2 border-b text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        arqueo.estado === 'cerrado'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {arqueo.estado.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded shadow disabled:opacity-50"
          >
            ⬅ Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página <strong>{page}</strong> de <strong>{totalPages}</strong>
          </span>
          <button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={page >= totalPages}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded shadow disabled:opacity-50"
          >
            Siguiente ➡
          </button>
        </div>

        <ModalError
          isOpen={errorOpen}
          onClose={() => setErrorOpen(false)}
          message={errorMessage}
        />
      </div>
    </div>
  );
};

export default ListarArqueosCaja;
