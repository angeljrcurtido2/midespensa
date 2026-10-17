export const DAYS_OF_WEEK = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const formatDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const parseInputDate = (input: string): Date | null => {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 8) {
    const day = parseInt(digits.slice(0, 2), 10);
    const month = parseInt(digits.slice(2, 4), 10) - 1;
    const year = parseInt(digits.slice(4, 8), 10);
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  }

  const parts = input.split("/").map(Number);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
};

export const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();

export const getFirstDayOfMonth = (month: number, year: number) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

import type { CalendarState, CalendarAction } from "./calendarReducer";

export const setDate = (dispatch: React.Dispatch<CalendarAction>, date: Date) => {
  dispatch({ type: "SET_SELECTED_DATE", payload: date });
  dispatch({ type: "SET_MONTH", payload: date.getMonth() });
  dispatch({ type: "SET_YEAR", payload: date.getFullYear() });
};

export const navigateMonth = (state: CalendarState, dispatch: React.Dispatch<CalendarAction>, direction: "prev" | "next") => {
  if (state.viewMode === "days") {
    const month = direction === "prev" ? (state.currentMonth === 0 ? 11 : state.currentMonth - 1)
                                       : (state.currentMonth === 11 ? 0 : state.currentMonth + 1);
    const year = direction === "prev" && state.currentMonth === 0 ? state.currentYear - 1 :
                 direction === "next" && state.currentMonth === 11 ? state.currentYear + 1 :
                 state.currentYear;
    dispatch({ type: "SET_MONTH", payload: month });
    dispatch({ type: "SET_YEAR", payload: year });
  } else {
    dispatch({ type: "SET_YEAR", payload: direction === "prev" ? state.currentYear - 1 : state.currentYear + 1 });
  }
};

