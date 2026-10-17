"use client";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { getCobrosDelDia } from "../../services/ingreso";
import { BanknotesIcon } from "@heroicons/react/24/solid";

interface DetalleCobro {
  idingreso:   number;
  monto:       string;
  hora:        string | null;
  concepto:    string;
  idformapago: number;
}
interface CobrosDia {
  fecha:    string;
  totalDia: string;
  detalle:  DetalleCobro[];
}

export default function CobrosDelDiaCard() {
  const [data, setData]   = useState<CobrosDia | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]     = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getCobrosDelDia();
        setData(res.data as CobrosDia);
      } catch {
        setErr("No se pudieron obtener los cobros del día");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <SkeletonCard />;
  if (err)     return <ErrorCard msg={err} />;
  if (!data)   return null;

  const fechaStr = new Date(data.fecha).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="h-full min-h-40 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-4 pb-4 pt-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-6">

      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
          <BanknotesIcon className="h-5 w-5" />
        </span>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Cobros {fechaStr}
        </h3>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell className="py-2 text-start text-xs font-medium text-gray-500 dark:text-gray-400">
                Concepto
              </TableCell>
              <TableCell className="py-2 text-end text-xs font-medium text-gray-500 dark:text-gray-400">
                Monto (Gs)
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.detalle.map((c) => (
              <TableRow key={c.idingreso}>
                <TableCell className="py-2 text-sm text-gray-700 dark:text-gray-300">
                  {c.concepto}
                </TableCell>
                <TableCell className="py-2 text-end text-sm font-medium text-gray-800 dark:text-white">
                  {parseFloat(c.monto).toLocaleString("es-PY")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="inline-block w-fit h-28 rounded-2xl bg-white shadow animate-pulse dark:bg-slate-900" />
  );
}
function ErrorCard({ msg }: { msg: string }) {
  return (
    <div className="inline-block w-fit rounded-2xl bg-white p-4 shadow ring-1 ring-red-500 text-red-600 dark:bg-slate-900 dark:text-red-400">
      {msg}
    </div>
  );
}
