'use client';
import React, { useState, useEffect } from 'react';
import {
  FaUser,
  FaPhone,
  FaIdCard,
  FaExclamationTriangle,
  FaClock,
  FaMoneyBillWave,
  FaFileInvoice,
  FaInfoCircle,
  FaSearch,
} from 'react-icons/fa';
import { listarClientesConCuotasVencidas } from '../../../services/ventas';
import { formatPY } from '../../../movimiento/utils/utils';
import CardText from './components/CardText';
import SelectPage from '../../../components/SelectPage';
import ButtonGrid from '../../../components/ButtonGrid';
import SelectPagination from '../../../components/SelectPagination';
import ModalDetallesCreditosCliente from '../ModalsVenta/ModalDetallesCreditosCliente';

interface ClienteVencido {
  idcliente: number;
  nombre: string;
  apellido: string;
  numDocumento: string;
  telefono: string;
  total_creditos: number;
  total_cuotas_vencidas: number;
  total_deuda_vencida: number;
  fecha_vencimiento_mas_antigua: string;
  dias_atraso_maximo: number;
}

const ListarClientesConCuotasVencidas: React.FC = () => {
  const [clientes, setClientes] = useState<ClienteVencido[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [vistaGrid, setVistaGrid] = useState(true);
  const [diasAtraso, setDiasAtraso] = useState('');

  // Modal states
  const [showModalDetalles, setShowModalDetalles] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteVencido | null>(null);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await listarClientesConCuotasVencidas({
        page,
        limit,
        search,
        diasAtraso,
      });

      if (response.data) {
        setClientes(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error al listar clientes con cuotas vencidas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [page, limit, search, diasAtraso]);

  const handleVerDetalles = (cliente: ClienteVencido) => {
    setClienteSeleccionado(cliente);
    setShowModalDetalles(true);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDiasAtrasoColor = (dias: number) => {
    if (dias <= 7) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    if (dias <= 30) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const getDiasAtrasoIcon = (dias: number) => {
    if (dias <= 7) return <FaClock className="mr-1 text-yellow-600" />;
    if (dias <= 30) return <FaExclamationTriangle className="mr-1 text-orange-600" />;
    return <FaExclamationTriangle className="mr-1 text-red-600" />;
  };

  const styleCardSmall = "bg-blue-50 rounded-lg p-3 border border-blue-200";
  const styleTxtCards = "text-xs text-blue-600 font-medium mb-1";
  const styleTxtLabelBold = "text-xs font-bold text-blue-700 truncate";

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-red-400 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1 flex items-center gap-3">
              <FaExclamationTriangle className="text-3xl" />
              Clientes con Cuotas Vencidas
            </h2>
            <p className="text-red-100">Gestión de cobros atrasados</p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl">
            <FaFileInvoice className="text-4xl" />
          </div>
        </div>
      </div>

      {/* Búsqueda y controles */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre o documento..."
              className="w-full pl-10 pr-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Filtro de días de atraso */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Días de atraso:</label>
              <select
                value={diasAtraso}
                onChange={(e) => {
                  setDiasAtraso(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="10">Hasta 10 días</option>
                <option value="20">11 - 20 días</option>
                <option value="30">21 - 30 días</option>
                <option value="50">31 - 50 días</option>
                <option value="90">51 - 90 días</option>
                <option value=">90">Más de 90 días</option>
              </select>
            </div>
            <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
            <ButtonGrid onClick={(isGrid) => setVistaGrid(isGrid)} vistaGrid={vistaGrid} />
          </div>
        </div>


      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      )}

      {/* Lista vacía */}
      {!loading && clientes.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FaInfoCircle className="text-gray-400 text-5xl mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {search
              ? 'No se encontraron clientes con ese criterio de búsqueda'
              : 'No hay clientes con cuotas vencidas en este momento'}
          </p>
        </div>
      )}

      {/* Lista de clientes */}
      {!loading && clientes.length > 0 && (
        <div className={vistaGrid ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'grid grid-cols-1 gap-4'}>
          {clientes.map((cliente) => (
            <div
              key={cliente.idcliente}
              className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all bg-white relative"
            >

              {/* Información del cliente */}
              <div className="mb-4 ">
                <div className=" items-center gap-2 mb-3 flex flex-row w-full">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FaUser className="text-blue-600" />
                  </div>

                  <h3 className="text-xs font-bold text-gray-800 truncate">
                    {cliente.nombre} {cliente.apellido}
                  </h3>

                  <div className={`flex flex-row w-auto px-3 py-1 rounded-full border-2 ${getDiasAtrasoColor(cliente.dias_atraso_maximo)}`}>
                    {getDiasAtrasoIcon(cliente.dias_atraso_maximo)}
                    <span className="text-xs font-bold">
                      {cliente.dias_atraso_maximo} {cliente.dias_atraso_maximo === 1 ? 'día' : 'días'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaIdCard className="text-blue-500" />
                    <span className="truncate">{cliente.numDocumento}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaPhone className="text-blue-500" />
                    <span className="truncate">{cliente.telefono || '--'}</span>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { title: "Créditos", text: cliente.total_creditos },
                  { title: "Cuotas Vencidas", text: cliente.total_cuotas_vencidas },
                  { title: "Deuda Vencida", text: formatPY(cliente.total_deuda_vencida) }
                ].map((card, index) => (
                  <CardText
                    key={index}
                    title={card.title}
                    text={card.text}
                    containerClass={styleCardSmall}
                    titleClass={styleTxtCards}
                    textClass={styleTxtLabelBold}
                  />
                ))}
              </div>

              {/* Fecha más antigua */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-red-600 mb-1">Vencimiento más antiguo</p>
                <p className="text-sm font-bold text-red-700">
                  {formatDate(cliente.fecha_vencimiento_mas_antigua)}
                </p>
              </div>

              {/* Botón de acción */}
              <button
                onClick={() => handleVerDetalles(cliente)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-all"
              >
                <FaMoneyBillWave />
                Ver Detalles y Cobrar
              </button>
            </div>
          ))}
        </div>
      )}


      <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />


      {/* Modal de detalles */}
      {clienteSeleccionado && (
        <ModalDetallesCreditosCliente
          isOpen={showModalDetalles}
          onClose={() => {
            setShowModalDetalles(false);
            setClienteSeleccionado(null);
            fetchClientes(); // Refrescar al cerrar
          }}
          idcliente={clienteSeleccionado.idcliente}
          nombreCompleto={`${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`}
          numDocumento={clienteSeleccionado.numDocumento}
        />
      )}
    </div>
  );
};

export default ListarClientesConCuotasVencidas;
