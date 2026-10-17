export const styleModalBox = "w-full h-auto md:max-w-[600px]  sm:max-w-[600px] max-w-[1000px]  transform overflow-auto rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all"
// max-h en vh y no en px fijos: con max-h-[600px] sobre una pantalla de 720px el
// panel recortaba el contenido (medido: 806px de alto real) y los botones de
// acción quedaban fuera de vista. 90vh deja margen para el padding del overlay y
// se adapta a cualquier altura de pantalla.
export const styleBoxModal = "w-[calc(100vw-2rem)] max-h-[90vh] md:max-w-[860px] lg:max-w-[1100px] xl:max-w-[1350px] 2xl:max-w-[1500px] overflow-auto rounded-2xl bg-white dark:bg-gray-800 p-0 transition-all"
export const styleSearchDark = "w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all text-sm sm:text-base"
export const styleCardSmall = "bg-blue-50 dark:bg-gray-700 rounded-lg p-3 border border-blue-200 dark:border-gray-600";
export const styleTxtCards = "text-xs text-blue-600 dark:text-blue-300 font-medium mb-1";
export const styleTxtLabelBold = "text-xs font-bold text-blue-700 dark:text-gray-100 truncate";
