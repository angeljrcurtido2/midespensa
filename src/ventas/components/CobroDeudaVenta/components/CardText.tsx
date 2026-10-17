interface CardTextProps {
    title: string;
    text: string | number;
    containerClass?: string;
    titleClass?: string;
    textClass?: string;
}

// Estilos por defecto con soporte dark mode
const defaultContainerClass = "bg-blue-50 dark:bg-gray-700 rounded-lg p-3 border border-blue-200 dark:border-gray-600";
const defaultTitleClass = "text-xs text-blue-600 dark:text-blue-300 font-medium mb-1";
const defaultTextClass = "text-xs font-bold text-blue-700 dark:text-gray-100 truncate";

const CardText = ({ title, text, containerClass, titleClass, textClass }: CardTextProps) => {
    return (
        <div className={containerClass || defaultContainerClass}>
            <p className={titleClass || defaultTitleClass}>{title}</p>
            <p className={textClass || defaultTextClass}>{text}</p>
        </div>
    );
}

export default CardText;