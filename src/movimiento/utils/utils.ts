export const formatPY = (
  value: string | number | null | undefined,
  withGs = true
): string => {
  if (value === null || value === undefined || value === '') return '--';


  const n = Number(value);

  if (isNaN(n)) return '--';           
  return n.toLocaleString('es-PY') + (withGs ? ' Gs' : '');
};