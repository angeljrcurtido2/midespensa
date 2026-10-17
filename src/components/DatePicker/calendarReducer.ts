
export interface CalendarState {
  isOpen: boolean;
  viewMode: "days" | "months";
  currentMonth: number;
  currentYear: number;
  selectedDate: Date | null;
  tempSelectedDate: Date | null;
}

export const initialCalendarState: CalendarState = {
  isOpen: false,
  viewMode: "days",
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  selectedDate: null,
  tempSelectedDate: null,
};

export type CalendarAction =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "SET_VIEW_MODE"; payload: "days" | "months" }
  | { type: "SET_MONTH"; payload: number }
  | { type: "SET_YEAR"; payload: number }
  | { type: "SET_SELECTED_DATE"; payload: Date }
  | { type: "SET_TEMP_DATE"; payload: Date }
  | { type: "RESET_TEMP_DATE" };

export function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case "OPEN":
      return { ...state, isOpen: true };
    case "CLOSE":
      return { ...state, isOpen: false, tempSelectedDate: null };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };
    case "SET_MONTH":
      return { ...state, currentMonth: action.payload };
    case "SET_YEAR":
      return { ...state, currentYear: action.payload };
    case "SET_SELECTED_DATE":
      return { ...state, selectedDate: action.payload };
    case "SET_TEMP_DATE":
      return { ...state, tempSelectedDate: action.payload };
    case "RESET_TEMP_DATE":
      return { ...state, tempSelectedDate: null };
    default:
      return state;
  }
}
