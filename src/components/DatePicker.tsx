'use client';

import { type FC, useReducer, useRef, useEffect, useState, type JSX } from "react";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";
import type { DateInputProps } from "./DatePicker/interface";
import { calendarReducer, initialCalendarState } from "./DatePicker/calendarReducer";
import { DAYS_OF_WEEK, formatDate, getDaysInMonth, getFirstDayOfMonth, MONTHS, parseInputDate, setDate } from "./DatePicker/utils";

export const DateInput: FC<DateInputProps> = ({
    disabled,
    value,
    placeholder = "dd/mm/aaaa",
    onChange,
    label,
    labelError,
    isError,
    labelClassName,
    inputClassName,
    containerClassName,
    name,
}) => {
    const [calendarState, dispatch] = useReducer(calendarReducer, initialCalendarState);
    const containerRef = useRef<HTMLDivElement>(null);
    const [tempInputValue, setTempInputValue] = useState("");

    // --- Init from prop value ---
    useEffect(() => {
        if (value) {
            const [day, month, year] = value.split("/").map(Number);
            if (day && month && year) {
                const date = new Date(year, month - 1, day);
                dispatch({ type: "SET_SELECTED_DATE", payload: date });
                dispatch({ type: "SET_MONTH", payload: month - 1 });
                dispatch({ type: "SET_YEAR", payload: year });
            }
        }
    }, [value]);

    // --- Click fuera del calendario ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                dispatch({ type: "CLOSE" });
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Solo actualizamos el input visual mientras escribimos
    const handleInputChange = (input: string) => {
        setTempInputValue(input);
    };

    // Ejecuta la validación y actualiza el calendario
    const commitInputDate = (closeCalendar = true) => {
        const cleanInput = tempInputValue.replace(/[^\d/]/g, "");
        if (!cleanInput) return;

        const newDate = parseInputDate(cleanInput);

        if (!newDate) return;

        if (!isNaN(newDate.getTime())) {
            const formatted = formatDate(newDate);
            setDate(dispatch, newDate);
            onChange?.(formatted);
            setTempInputValue(formatted);
        }

        if (closeCalendar) {
            dispatch({ type: "CLOSE" });
        }
    };

    useEffect(() => {
        if (calendarState.selectedDate) {
            setTempInputValue(formatDate(calendarState.selectedDate));
        }
    }, [calendarState.selectedDate]);

    const isSelectedDay = (day: number) => {
        const d = calendarState.tempSelectedDate || calendarState.selectedDate;
        if (!d) return false;
        return (
            d.getDate() === day &&
            d.getMonth() === calendarState.currentMonth &&
            d.getFullYear() === calendarState.currentYear
        );
    };


    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(calendarState.currentMonth, calendarState.currentYear);
        const firstDay = getFirstDayOfMonth(calendarState.currentMonth, calendarState.currentYear);

        const days: JSX.Element[] = [];

        // Días del mes anterior (para llenar la primera semana)
        const prevMonth = calendarState.currentMonth === 0 ? 11 : calendarState.currentMonth - 1;
        const prevYear = calendarState.currentMonth === 0 ? calendarState.currentYear - 1 : calendarState.currentYear;
        const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear);

        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            days.push(
                <div key={`prev-${day}`} className="h-8 w-8 flex items-center justify-center text-sm text-gray-300">
                    {day}
                </div>
            );
        }

        // Días del mes actual
        for (let day = 1; day <= daysInMonth; day++) {
            const selected = isSelectedDay(day);

            days.push(
                <button
                    key={day}
                    type="button"
                    onClick={() =>
                        dispatch({
                            type: "SET_TEMP_DATE",
                            payload: new Date(calendarState.currentYear, calendarState.currentMonth, day),
                        })
                    }
                    className={`
                        h-8 w-8 rounded-lg flex items-center justify-center text-sm cursor-pointer transition-colors
                        ${selected ? "bg-[#ED1A3B] text-white" : ""}
                        ${!selected && "hover:bg-[#F9B8C2] hover:border hover:border-black"}
                        `}
                >
                    {day}
                </button>
            );
        }

        // Días del mes siguiente (para llenar la última semana)
        const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
        const nextDays = totalCells - (firstDay + daysInMonth);
        for (let i = 1; i <= nextDays; i++) {
            days.push(
                <div key={`next-${i}`} className="h-8 w-8 flex items-center justify-center text-sm text-gray-300">
                    {i}
                </div>
            );
        }

        return days;
    };


    const handlePrev = () => {
        if (calendarState.viewMode === "days") {
            if (calendarState.currentMonth === 0) {
                dispatch({ type: "SET_MONTH", payload: 11 });
                dispatch({ type: "SET_YEAR", payload: calendarState.currentYear - 1 });
            } else dispatch({ type: "SET_MONTH", payload: calendarState.currentMonth - 1 });
        } else dispatch({ type: "SET_YEAR", payload: calendarState.currentYear - 1 });
    };

    const handleNext = () => {
        if (calendarState.viewMode === "days") {
            if (calendarState.currentMonth === 11) {
                dispatch({ type: "SET_MONTH", payload: 0 });
                dispatch({ type: "SET_YEAR", payload: calendarState.currentYear + 1 });
            } else dispatch({ type: "SET_MONTH", payload: calendarState.currentMonth + 1 });
        } else dispatch({ type: "SET_YEAR", payload: calendarState.currentYear + 1 });
    };

    const handleConfirm = () => {
        if (calendarState.tempSelectedDate) {
            const formatted = formatDate(calendarState.tempSelectedDate);

            setDate(dispatch, calendarState.tempSelectedDate);
            onChange?.(formatted);
            setTempInputValue(formatted); 
        }
        dispatch({ type: "CLOSE" });
    };

    const handleCancel = () => {
        dispatch({ type: "CLOSE" });
    };

    return (
        <div ref={containerRef} className={`relative ${containerClassName}`}>
            {label && <label className={`block text-sm mb-1 ${labelClassName}`}>{label}</label>}
            <div className="relative">
                <input
                    name={name}
                    value={tempInputValue}
                    disabled={disabled}
                    placeholder={placeholder}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") commitInputDate();
                    }}
                    onBlur={() => {commitInputDate(false)}}
                    onClick={() => !disabled && dispatch({ type: "OPEN" })}
                    className={`shadow-[0px_0px_10px_0px_#00000024] border bg-white pl-4 pr-10 py-2 rounded-xl w-full outline-none focus:outline-none focus:ring-0 focus:border-[#ED1A3B] cursor-pointer ${calendarState.isOpen ? "border-[#ED1A3B]" : "border-gray-300"} ${inputClassName} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none">
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                </div>
            </div>

            {calendarState.isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-[0px_0px_10px_0px_#00000024] p-4 z-50 min-w-[280px]">
                    <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={handlePrev} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>

                        <span className="font-medium text-sm cursor-pointer select-none" onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: calendarState.viewMode === "days" ? "months" : "days" })}>
                            {calendarState.viewMode === "days" ? `${MONTHS[calendarState.currentMonth]} ${calendarState.currentYear}` : calendarState.currentYear}
                        </span>

                        <button type="button" onClick={handleNext} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer rotate-180">
                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                    </div>
                    {calendarState.viewMode === "days" ? (
                        <>
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {DAYS_OF_WEEK.map((day) => (
                                    <div key={day} className="h-8 w-8 flex items-center justify-center text-xs text-gray-500">{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
                        </>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {MONTHS.map((month, index) => (
                                <button
                                    key={month}
                                    type="button"
                                    className={`py-2 px-3 rounded-lg text-sm hover:bg-gray-100 ${index === calendarState.currentMonth ? "bg-[#ED1A3B] text-white" : ""}`}
                                    onClick={() => {
                                        dispatch({ type: "SET_MONTH", payload: index });
                                        dispatch({ type: "SET_VIEW_MODE", payload: "days" });
                                    }}
                                >
                                    {month}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-center gap-2 mt-4 pt-3 border-t border-gray-200">
                        <SecondaryButton texto="Cancelar" onClick={handleCancel} className="!text-black" />
                        <PrimaryButton texto="Elegir" onClick={handleConfirm} />
                    </div>
                </div>
            )}

            {isError && <p className="text-[#ED1A3B] text-xs mt-2">{labelError}</p>}
        </div>
    );
};
