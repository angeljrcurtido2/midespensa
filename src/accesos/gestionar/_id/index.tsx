import { useEffect,useState } from 'react';
import { useParams } from 'react-router-dom';
import SidebarLayout from '../../../components/SidebarLayout';
import PaginaFormulario from '../../../components/PaginaFormulario';
import { useCerrarVentana } from '../../../hooks/useAlVolverALaVentana';
import GestionAccesos from '../../../usuario/components/GestionAccesos';
interface Persona {idfuncionario:number;idempleado:number|null;nombre:string;apellido:string;tipo_funcionario:string;}
function Contenido(){const {id}=useParams();const cerrar=useCerrarVentana();const [persona,setPersona]=useState<Persona|null>(null);useEffect(()=>{try{const dato=JSON.parse(sessionStorage.getItem('accesos-funcionario-actual')||'null');if(dato&&String(dato.idfuncionario)===String(id))setPersona(dato);}catch{setPersona(null);}},[id]);return <PaginaFormulario titulo="Gestionar accesos" volverA="/accesos" textoVolver="Volver a usuarios y accesos">{persona?<GestionAccesos idfuncionario={persona.idfuncionario} nombreFuncionario={`${persona.nombre} ${persona.apellido}`} rolActual={persona.tipo_funcionario} idempleadoActual={persona.idempleado} onClose={()=>cerrar('/accesos')}/>:<p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">No se encontró la persona seleccionada. Volvé al listado y abrí la gestión nuevamente.</p>}</PaginaFormulario>;}
export default function Page(){return <SidebarLayout><Contenido/></SidebarLayout>;}
