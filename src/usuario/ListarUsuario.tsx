'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaEdit, FaTrash } from 'react-icons/fa';
import { getUsuariosPaginated, deleteUsuario, getDataUser } from '../services/usuarios';
import { useAlVolverALaVentana } from '../hooks/useAlVolverALaVentana';
import ModalAdvert from '../components/ModalAdvert';
import ModalSuccess from '../components/ModalSuccess';
import ModalError from '../components/ModalError';
import SelectPage from '../components/SelectPage';
import SelectPagination from '../components/SelectPagination';
import { PaginaListado, EncabezadoListado, BotonPrincipal, BarraFiltros, CampoBusqueda, TablaListado, AccionFila, Insignia } from '../components/listado/Listado';

export default function ListarUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [modalAdvertOpen, setModalAdvertOpen] = useState(false);
  const [modalSuccessOpen, setModalSuccessOpen] = useState(false);
  const [modalErrorOpen, setModalErrorOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [esProveedor, setEsProveedor] = useState(false);

  useEffect(() => {
    getDataUser().then((res) => setEsProveedor(res.data?.esProveedor === true)).catch(() => setEsProveedor(false));
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await getUsuariosPaginated({ page, limit, search });
      setUsuarios(res.data.data ?? []);
      setTotalPages(res.data.totalPages ?? 1);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      setModalMessage('Error al obtener los usuarios');
      setModalErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchUsuarios(); }, [page, limit, search]);
  useAlVolverALaVentana(() => { void fetchUsuarios(); });

  const handleAnularUsuario = async () => {
    if (!usuarioSeleccionado) return;
    try {
      await deleteUsuario(usuarioSeleccionado.idusuarios);
      setModalAdvertOpen(false);
      setModalMessage('Usuario anulado correctamente');
      setModalSuccessOpen(true);
      void fetchUsuarios();
    } catch (error) {
      setModalAdvertOpen(false);
      setModalMessage('Error al anular usuario');
      setModalErrorOpen(true);
      console.error(error);
    }
  };

  return (
    <PaginaListado>
      <EncabezadoListado
        icono={<FaUserShield />}
        titulo="Usuarios"
        subtitulo="Administra los accesos y permisos"
        acciones={esProveedor ? <BotonPrincipal color="azul" onClick={() => navigate('/usuario/nuevo')}>Nuevo usuario</BotonPrincipal> : undefined}
      />
      <BarraFiltros derecha={<SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />}>
        <CampoBusqueda valor={search} onCambio={(valor) => { setSearch(valor); setPage(1); }} placeholder="Buscar por login, nombre o acceso..." />
      </BarraFiltros>
      <TablaListado
        filas={usuarios}
        claveFila={(usuario) => usuario.idusuarios}
        cargando={loading}
        vacio={search ? 'No se encontraron usuarios con esa busqueda' : 'No hay usuarios registrados'}
        anchoMinimo={900}
        columnas={[
          { clave: 'usuario', titulo: 'Usuario', render: (u) => <><p className="font-bold text-slate-900 dark:text-slate-100">{u.nombre} {u.apellido}</p><p className="text-xs text-slate-500">@{u.login}</p></> },
          { clave: 'acceso', titulo: 'Rol / Acceso', render: (u) => u.acceso || '-' },
          { clave: 'telefono', titulo: 'Telefono', sinSalto: true, render: (u) => u.telefono || '-' },
          { clave: 'email', titulo: 'Correo', render: (u) => u.email || '-' },
          { clave: 'estado', titulo: 'Estado', render: (u) => <Insignia color={(u.estado || '').toLowerCase() === 'activo' ? 'verde' : 'rojo'}>{u.estado || 'Inactivo'}</Insignia> },
        ]}
        acciones={(usuario) => (
          <>
            <AccionFila icono={<FaEdit />} texto="Editar" onClick={() => navigate(`/usuario/editar/${usuario.idusuarios}`)} />
            <AccionFila icono={<FaTrash />} texto="Anular" tipo="peligro" onClick={() => { setUsuarioSeleccionado(usuario); setModalAdvertOpen(true); }} />
          </>
        )}
      />
      <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
      <ModalAdvert
        isOpen={modalAdvertOpen}
        message={`Deseas anular al usuario "${usuarioSeleccionado?.login}"?`}
        onConfirm={handleAnularUsuario}
        onClose={() => setModalAdvertOpen(false)}
      />
      <ModalSuccess isOpen={modalSuccessOpen} message={modalMessage} onClose={() => setModalSuccessOpen(false)} />
      <ModalError isOpen={modalErrorOpen} message={modalMessage} onClose={() => setModalErrorOpen(false)} />
    </PaginaListado>
  );
}
