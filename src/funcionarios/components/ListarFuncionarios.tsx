'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserTie, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { getFuncionariosPaginated, deleteFuncionario, changeStatus } from '../../services/funcionarios';
import ModalError from '../../components/ModalError';
import ModalSuccess from '../../components/ModalSuccess';
import ModalAdvert from '../../components/ModalAdvert';
import SelectPage from '../../components/SelectPage';
import SelectPagination from '../../components/SelectPagination';
import { useAlVolverALaVentana } from '../../hooks/useAlVolverALaVentana';
import { PaginaListado, EncabezadoListado, BotonPrincipal, BarraFiltros, CampoBusqueda, TablaListado, AccionFila, Insignia } from '../../components/listado/Listado';

export default function ListarFuncionarios() {
  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [modalAdvertOpen, setModalAdvertOpen] = useState(false);
  const [advertMessage, setAdvertMessage] = useState('');
  const [advertAction, setAdvertAction] = useState<(() => void) | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchFuncionarios = async () => {
    setLoading(true);
    try {
      const res = await getFuncionariosPaginated({ page, limit, search });
      setFuncionarios(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Error al obtener funcionarios:', error);
      setErrorMessage('No se pudieron cargar los funcionarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchFuncionarios(); }, [page, limit, search]);
  useAlVolverALaVentana(() => { void fetchFuncionarios(); });

  const confirmar = (mensaje: string, accion: () => Promise<void>) => {
    setAdvertMessage(mensaje);
    setAdvertAction(() => accion);
    setModalAdvertOpen(true);
  };

  const ejecutarAccion = async () => {
    try {
      await advertAction?.();
    } finally {
      setModalAdvertOpen(false);
      setAdvertAction(null);
    }
  };

  return (
    <PaginaListado>
      <EncabezadoListado
        icono={<FaUserTie />}
        titulo="Funcionarios"
        subtitulo="Administra los funcionarios del sistema"
        acciones={<BotonPrincipal color="azul" onClick={() => navigate('/funcionarios/nuevo')}>Nuevo funcionario</BotonPrincipal>}
      />
      <BarraFiltros derecha={<SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />}>
        <CampoBusqueda valor={search} onCambio={(valor) => { setSearch(valor); setPage(1); }} placeholder="Buscar por nombre, apellido o login..." />
      </BarraFiltros>
      <TablaListado
        filas={funcionarios}
        claveFila={(f) => f.idfuncionario}
        cargando={loading}
        vacio={search ? 'No se encontraron funcionarios con esa busqueda' : 'No hay funcionarios registrados'}
        anchoMinimo={850}
        columnas={[
          { clave: 'nombre', titulo: 'Funcionario', render: (f) => <><p className="font-bold text-slate-900 dark:text-slate-100">{f.nombre} {f.apellido}</p><p className="text-xs text-slate-500">{f.tipo_funcionario || '-'}</p></> },
          { clave: 'login', titulo: 'Login', render: (f) => f.login || '-' },
          { clave: 'telefono', titulo: 'Telefono', sinSalto: true, render: (f) => f.telefono || '-' },
          { clave: 'estado', titulo: 'Estado', render: (f) => <Insignia color={f.estado === 'activo' ? 'verde' : 'rojo'}>{f.estado || 'Inactivo'}</Insignia> },
        ]}
        acciones={(f) => (
          <>
            <AccionFila icono={<FaEdit />} texto="Editar" onClick={() => navigate(`/funcionarios/editar/${f.idfuncionario}`)} />
            <AccionFila icono={f.estado === 'activo' ? <FaToggleOff /> : <FaToggleOn />} texto={f.estado === 'activo' ? 'Desactivar' : 'Activar'} tipo="neutra" onClick={() => confirmar(`Deseas cambiar el estado a ${f.estado === 'activo' ? 'inactivo' : 'activo'}?`, async () => { await changeStatus(f.idfuncionario, { estado: f.estado === 'activo' ? 'inactivo' : 'activo' }); setSuccessMessage('Estado actualizado'); void fetchFuncionarios(); })} />
            <AccionFila icono={<FaTrash />} texto="Eliminar" tipo="peligro" onClick={() => confirmar('Estas seguro de que deseas eliminar este funcionario?', async () => { await deleteFuncionario(f.idfuncionario); setSuccessMessage('Funcionario eliminado'); void fetchFuncionarios(); })} />
          </>
        )}
      />
      <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
      <ModalError isOpen={!!errorMessage} onClose={() => setErrorMessage('')} message={errorMessage} />
      <ModalSuccess isOpen={!!successMessage} onClose={() => setSuccessMessage('')} message={successMessage} />
      <ModalAdvert isOpen={modalAdvertOpen} onClose={() => setModalAdvertOpen(false)} message={advertMessage} onConfirm={ejecutarAccion} confirmButtonText="Confirmar" />
    </PaginaListado>
  );
}
