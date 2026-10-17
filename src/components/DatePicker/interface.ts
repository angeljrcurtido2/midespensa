export interface DateInputProps {
  disabled?: boolean;
  value?: string;
  placeholder?: string;
  onChange?: (date: string) => void;
  labelClassName?: string;
  label?: string;
  labelError?: string;
  isError?: boolean;
  inputClassName?: string;
  containerClassName?: string;
  name?: string;
}

export interface CalendarState {
  isOpen: boolean;
  viewMode: "days" | "months";
  currentMonth: number;
  currentYear: number;
  selectedDate: Date | null;
  tempSelectedDate: Date | null;
}
