'use client';

import { useNavigate } from 'react-router-dom';
import { useAlVolverALaVentana } from '../../hooks/useAlVolverALaVentana';

import { useCallback, useEffect, useState } from 'react';
import { FaMoneyBillWave, FaSearch, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import {
    deleteSalario,
    type Empleado,
    type Salario,
    getEmpleados,
    getSalarios,
} from '../../services/rrhh';
import ModalCrearSalario from './ModalsSalarios/ModalCrearSalario';
import ModalEditarSalario from './ModalsSalarios/ModalEditarSalario';
import ModalError from '../../components/ModalError';
import ModalSuccess from '../../components/ModalSuccess';
import ModalAdvert from '../../components/ModalAdvert';
import ButtonGrid from '../../components/ButtonGrid';
import SelectPage from '../../components/SelectPage';
import SelectPagination from '../../components/SelectPagination';
import CardText from '../../ventas/components/CobroDeudaVenta/components/CardText';
import ButtonGral from '../../components/ButtonGral';
import { calcularValorHora } from '../utils/calculoSalario';
import {
    styleCardSmall,
    styleSearchDark,
    styleTxtCards,
    styleTxtLabelBold,
} from '../../components/utils/stylesGral';

const formatGs = (value: number | string | null | undefined) => {
    const num = Number(value || 0);
    // Se redondea: el guaraní no tiene centavos y un valor hora derivado da
    // decimales largos ("13.333,333 Gs") que sólo ensucian la tarjeta.
    return new Intl.NumberFormat('es-PY').format(Math.round(num)) + ' Gs.';
};

// El backend devuelve las fechas en ISO; mostrarlas crudas deja
// "2026-09-01T03:00:00.000Z" en pantalla.
const formatFecha = (valor: string | null | undefined) => {
    if (!valor) return null;
    const soloFecha = String(valor).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(soloFecha)) return String(valor);
    const [a, m, d] = soloFecha.split('-');
    return `${d}/${m}/${a}`;
};

const ListarSalario = () => {
  const navigate = useNavigate();
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [idempleado] = useState<string>('');
    const [search, setSearch] = useState('');
    const [salarios, setSalarios] = useState<Salario[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [vistaGrid, setVistaGrid] = useState(true);
    const [loading, setLoading] = useState(false);

    const [modalCrearOpen, setModalCrearOpen] = useState(false);
    const [modalEditarOpen, setModalEditarOpen] = useState(false);
    const [idSalario] = useState<number | string>('');

    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [modalAdvertOpen, setModalAdvertOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | string>('');

    const fetchEmpleados = useCallback(async () => {
        try {
            const res = await getEmpleados({ page: 1, limit: 200 });
            setEmpleados(res.data.data || []);
        } catch (error) {
            console.error('Error al obtener empleados:', error);
            setErrorMessage('  No se pudo cargar el listado de empleados');
        }
    }, []);

    const fetchSalarios = useCallback(async () => {
        const empleadoSeleccionado = empleados.find(
            (emp) => String(emp.idempleado) === idempleado,
        );

        const params: {
            page: number;
            limit: number;
            search?: string;
            nombre?: string;
            documento?: string;
        } = {
            page,
            limit,
        };

        if (search.trim()) {
            params.search = search.trim();
        }

        if (empleadoSeleccionado?.nombre) {
            params.nombre = empleadoSeleccionado.nombre;
        }

        if (empleadoSeleccionado?.cedula) {
            params.documento = empleadoSeleccionado.cedula;
        }

        try {
            setLoading(true);
            const res = await getSalarios(params);
            setSalarios(res.data.data || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (error) {
            console.error('Error al obtener salarios:', error);
            setErrorMessage('  No se pudo cargar la lista de salarios');
        } finally {
            setLoading(false);
        }
    }, [empleados, idempleado, page, limit, search]);

    useEffect(() => {
        fetchEmpleados();
    }, [fetchEmpleados]);

    useEffect(() => {
        fetchSalarios();
    }, [fetchSalarios]);

    useAlVolverALaVentana(() => { void fetchSalarios(); });

  const handleEdit = (id: number | string) => {
    navigate('/salarios/editar/' + id);
  };

    const handleDelete = (id: number | string) => {
        setIdToDelete(id);
        setModalAdvertOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!idToDelete) return;

        try {
            await deleteSalario(idToDelete);
            setSuccessMessage('  Salario eliminado exitosamente');
            fetchSalarios();
        } catch (error) {
            console.error('Error al eliminar salario:', error);
            setErrorMessage('  No se pudo eliminar el salario');
        } finally {
            setModalAdvertOpen(false);
            setIdToDelete('');
        }
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8"
            style={{ scrollbarGutter: 'stable' }}
        >
            <div className="max-w-7xl mx-auto">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 text-white">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 md:gap-5">
                        <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 md:p-5 rounded-2xl shrink-0">
                            <FaMoneyBillWave className="text-white text-2xl sm:text-3xl md:text-4xl" />
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-1">
                                Gestión de Salarios
                            </h1>
                            <p className="text-xs sm:text-sm md:text-base text-blue-100">
                                Administrá el sueldo de cada empleado
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-5 md:mb-6">
                    <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="relative w-full">
                                <FaSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
                                <input
                                    type="text"
                                    placeholder="Buscar salario (search, nombre, documento)..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className={styleSearchDark}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center justify-between">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
                                <ButtonGrid onClick={(isGrid) => setVistaGrid(isGrid)} vistaGrid={vistaGrid} />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <ButtonGral
                                    text="Nuevo Salario"
                                    onClick={() => navigate('/salarios/nuevo')}
                                    icon={<FaPlus />}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {!loading && salarios.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-500 dark:text-gray-300 shadow">
                        No se encontraron salarios.
                    </div>
                )}

                {!loading && salarios.length > 0 && (
                    <div className={vistaGrid ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4' : 'grid grid-cols-1 gap-3'}>
                        {salarios.map((salario) => (
                            <div
                                key={salario.idsalario}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-500"
                            >
                                <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-gray-700 dark:to-gray-800 text-white">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-bold text-sm sm:text-base truncate">
                                            Salario #{salario.idsalario}
                                        </h3>
                                        {/* Sin la modalidad visible, un jornal y un sueldo
                                            mensual del mismo monto se ven idénticos. */}
                                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-white/20 whitespace-nowrap">
                                            {salario.modalidad || 'Mensual'}
                                        </span>
                                    </div>
                                    <p className="text-xs opacity-90">
                                        Vigencia: {formatFecha(salario.fecha_inicio) || 'N/A'}
                                        {salario.fecha_fin
                                            ? ` - ${formatFecha(salario.fecha_fin)}`
                                            : ' - Vigente'}
                                    </p>
                                </div>

                                <div className="p-3 sm:p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <CardText
                                            title={
                                                salario.modalidad === 'Hora' ? 'Monto por hora'
                                                    : salario.modalidad === 'Jornal' ? 'Monto por día'
                                                        : salario.modalidad === 'Quincenal' ? 'Por quincena'
                                                            : 'Sueldo mensual'
                                            }
                                            text={formatGs(salario.salario_base)}
                                            containerClass={styleCardSmall}
                                            titleClass={styleTxtCards}
                                            textClass={styleTxtLabelBold}
                                        />
                                        <CardText
                                            title="Valor hora"
                                            text={formatGs(calcularValorHora(salario))}
                                            containerClass={styleCardSmall}
                                            titleClass={styleTxtCards}
                                            textClass={styleTxtLabelBold}
                                        />
                                        <CardText
                                            title="Fecha inicio"
                                            text={formatFecha(salario.fecha_inicio) || 'N/A'}
                                            containerClass={styleCardSmall}
                                            titleClass={styleTxtCards}
                                            textClass={styleTxtLabelBold}
                                        />
                                        <CardText
                                            title="Fecha fin"
                                            text={formatFecha(salario.fecha_fin) || 'Vigente'}
                                            containerClass={styleCardSmall}
                                            titleClass={styleTxtCards}
                                            textClass={styleTxtLabelBold}
                                        />
                                        <CardText
                                            title="Motivo"
                                            text={salario.motivo || 'Sin motivo'}
                                            containerClass={styleCardSmall}
                                            titleClass={styleTxtCards}
                                            textClass={styleTxtLabelBold}
                                        />
                                    </div>

                                    <div className="pt-3 border-t border-blue-100 dark:border-gray-600">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(salario.idsalario)}
                                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                                            >
                                                <FaEdit /> Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(salario.idsalario)}
                                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                                            >
                                                <FaTrash /> Borrar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
            </div>

            <ModalCrearSalario
                isOpen={modalCrearOpen}
                onClose={() => setModalCrearOpen(false)}
                onSuccess={fetchSalarios}
            />
            <ModalEditarSalario
                id={idSalario}
                isOpen={modalEditarOpen}
                onClose={() => setModalEditarOpen(false)}
                onSuccess={fetchSalarios}
            />
            <ModalError isOpen={!!errorMessage} onClose={() => setErrorMessage('')} message={errorMessage} />
            <ModalSuccess isOpen={!!successMessage} onClose={() => setSuccessMessage('')} message={successMessage} />
            <ModalAdvert
                isOpen={modalAdvertOpen}
                onClose={() => setModalAdvertOpen(false)}
                message="Estas seguro de que deseas eliminar este salario?"
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};

export default ListarSalario;
