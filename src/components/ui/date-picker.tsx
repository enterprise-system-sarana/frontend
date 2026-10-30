import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

/* All values stay plain strings ("YYYY-MM-DD" / "YYYY-MM"), the same shape native inputs produced. */

const pad = (value: number) => String(value).padStart(2, "0");
const toIso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const toMonthValue = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

/** Parses as local time: `new Date("YYYY-MM-DD")` is UTC and can land on the previous day. */
const parseIso = (value?: string | null): Date | null => {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(value ?? "");
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3] ?? 1));
  return Number.isNaN(date.getTime()) ? null : date;
};

const sameDay = (a: Date | null, b: Date | null) => !!a && !!b && toIso(a) === toIso(b);

function useDateLocale() {
  const { language, t } = useLanguage();
  const locale = language === "km" ? "km-KH" : "en-US";
  return useMemo(() => {
    const weekday = new Intl.DateTimeFormat(locale, { weekday: language === "km" ? "narrow" : "short" });
    return {
      t,
      weekdays: Array.from({ length: 7 }, (_, i) => {
        const label = weekday.format(new Date(2026, 1, 1 + i)); // 1 Feb 2026 is a Sunday
        return language === "km" ? label : label.slice(0, 2);
      }),
      monthsShort: Array.from({ length: 12 }, (_, i) =>
        new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(2026, i, 1)),
      ),
      monthYear: (date: Date) => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date),
      day: (date: Date) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(date),
      month: (date: Date) => new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(date),
    };
  }, [language, locale, t]);
}

const triggerClass = cn(
  "flex h-9 w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm text-foreground shadow-2xs outline-none",
  "transition-[border-color,box-shadow] duration-150 hover:border-primary/40",
  "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15",
  "data-[state=open]:border-primary data-[state=open]:ring-3 data-[state=open]:ring-primary/15",
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15",
  "disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60",
);

function ClearButton({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      title={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClear();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onClear();
        }
      }}
      className="-mr-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <X className="size-3.5" />
    </span>
  );
}

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} className="shrink-0">
      {children}
    </Button>
  );
}

function monthDisabled(year: number, month: number, min: Date | null, max: Date | null) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return (!!min && last < min) || (!!max && first > max);
}

/** Month grid with a year header — the month picker, and the calendar's jump-to-month view. */
function MonthGrid({
  year,
  onYearChange,
  selected,
  min,
  max,
  onSelect,
}: {
  year: number;
  onYearChange: (year: number) => void;
  selected: Date | null;
  min: Date | null;
  max: Date | null;
  onSelect: (month: number) => void;
}) {
  const { monthsShort, t } = useDateLocale();
  const today = new Date();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <NavButton label={t("date.previous_year", "Previous year")} onClick={() => onYearChange(year - 1)}>
          <ChevronLeft />
        </NavButton>
        <span className="text-sm font-semibold text-foreground tabular-nums">{year}</span>
        <NavButton label={t("date.next_year", "Next year")} onClick={() => onYearChange(year + 1)}>
          <ChevronRight />
        </NavButton>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {monthsShort.map((label, month) => {
          const isSelected = selected?.getFullYear() === year && selected.getMonth() === month;
          const isCurrent = today.getFullYear() === year && today.getMonth() === month;
          return (
            <button
              key={label}
              type="button"
              disabled={monthDisabled(year, month, min, max)}
              onClick={() => onSelect(month)}
              className={cn(
                "h-10 cursor-pointer rounded-lg text-sm transition-colors disabled:pointer-events-none disabled:text-text-disabled",
                isSelected
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "text-foreground hover:bg-muted",
                !isSelected && isCurrent && "font-semibold text-primary ring-1 ring-inset ring-primary/40",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface CalendarProps {
  /** Single selection. */
  selected?: Date | null;
  /** Range selection. */
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  min: Date | null;
  max: Date | null;
  onSelect: (date: Date) => void;
}

function Calendar({ selected = null, rangeStart = null, rangeEnd = null, min, max, onSelect }: CalendarProps) {
  const { weekdays, monthYear, t } = useDateLocale();
  const anchor = selected ?? rangeEnd ?? rangeStart ?? new Date();
  const [view, setView] = useState<"days" | "months">("days");
  const [cursor, setCursor] = useState(() => new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  const [focused, setFocused] = useState(() => anchor);
  const [hovered, setHovered] = useState<Date | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus();
  }, [focused]);

  const today = new Date();
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const days = useMemo(() => {
    const first = new Date(year, month, 1 - new Date(year, month, 1).getDay());
    return Array.from(
      { length: 42 },
      (_, i) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + i),
    );
  }, [year, month]);

  // While the second date is being picked, preview the range up to the hovered day.
  const previewEnd = rangeStart && !rangeEnd ? hovered : rangeEnd;
  const [rangeFrom, rangeTo] =
    rangeStart && previewEnd && previewEnd < rangeStart ? [previewEnd, rangeStart] : [rangeStart, previewEnd];

  const isDisabled = (date: Date) => (!!min && date < min) || (!!max && date > max);

  const handleGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const delta = step[e.key];
    if (!delta) return;
    e.preventDefault();
    const next = new Date(focused.getFullYear(), focused.getMonth(), focused.getDate() + delta);
    moveFocus.current = true;
    setFocused(next);
    if (next.getMonth() !== month || next.getFullYear() !== year) {
      setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  };

  if (view === "months") {
    return (
      <MonthGrid
        year={year}
        onYearChange={(nextYear) => setCursor(new Date(nextYear, month, 1))}
        selected={cursor}
        min={min}
        max={max}
        onSelect={(nextMonth) => {
          setCursor(new Date(year, nextMonth, 1));
          setView("days");
        }}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-1">
        <NavButton label={t("date.previous_month", "Previous month")} onClick={() => setCursor(new Date(year, month - 1, 1))}>
          <ChevronLeft />
        </NavButton>
        <button
          type="button"
          onClick={() => setView("months")}
          className="flex h-8 min-w-0 cursor-pointer items-center gap-1 rounded-lg px-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <span className="truncate">{monthYear(cursor)}</span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
        <NavButton label={t("date.next_month", "Next month")} onClick={() => setCursor(new Date(year, month + 1, 1))}>
          <ChevronRight />
        </NavButton>
      </div>

      <div ref={gridRef} role="grid" onKeyDown={handleGridKey} onMouseLeave={() => setHovered(null)}>
        <div role="row" className="grid grid-cols-7">
          {weekdays.map((label, i) => (
            <span
              key={`${label}-${i}`}
              role="columnheader"
              className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {days.map((date) => {
            const outside = date.getMonth() !== month;
            const isToday = sameDay(date, today);
            const isSelected = sameDay(date, selected) || sameDay(date, rangeStart) || sameDay(date, rangeEnd);
            const inRange = !!rangeFrom && !!rangeTo && date > rangeFrom && date < rangeTo;
            const isRangeFrom = !!rangeTo && sameDay(date, rangeFrom) && !sameDay(rangeFrom, rangeTo);
            const isRangeTo = !!rangeFrom && sameDay(date, rangeTo) && !sameDay(rangeFrom, rangeTo);

            return (
              <div
                key={toIso(date)}
                role="gridcell"
                className={cn(
                  "flex justify-center",
                  inRange && "bg-primary-light/70",
                  isRangeFrom && "bg-linear-to-r from-transparent from-50% to-primary-light/70 to-50%",
                  isRangeTo && "bg-linear-to-l from-transparent from-50% to-primary-light/70 to-50%",
                )}
              >
                <button
                  type="button"
                  tabIndex={sameDay(date, focused) ? 0 : -1}
                  disabled={isDisabled(date)}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  onClick={() => onSelect(date)}
                  onFocus={() => setFocused(date)}
                  onMouseEnter={() => setHovered(date)}
                  className={cn(
                    "flex size-9 cursor-pointer items-center justify-center rounded-lg text-sm tabular-nums outline-none transition-colors",
                    "focus-visible:ring-3 focus-visible:ring-primary/25 disabled:pointer-events-none disabled:text-text-disabled disabled:line-through",
                    isSelected
                      ? "bg-primary font-semibold text-primary-foreground"
                      : outside
                        ? "text-text-disabled hover:bg-muted"
                        : "text-foreground hover:bg-muted",
                    !isSelected && isToday && "font-semibold text-primary ring-1 ring-inset ring-primary/40",
                  )}
                >
                  {date.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PanelFooter({
  clearLabel,
  todayLabel,
  onClear,
  onToday,
}: {
  clearLabel?: string;
  todayLabel: string;
  onClear?: () => void;
  onToday?: () => void;
}) {
  return (
    <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
      {onClear ? (
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          {clearLabel}
        </Button>
      ) : (
        <span />
      )}
      {onToday && (
        <Button type="button" variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={onToday}>
          {todayLabel}
        </Button>
      )}
    </div>
  );
}

const focusSelectedDay = (e: Event) => {
  const day = (e.currentTarget as HTMLElement | null)?.querySelector<HTMLButtonElement>('[role="grid"] [tabindex="0"]');
  if (day) {
    e.preventDefault();
    day.focus();
  }
};

interface DatePickerProps {
  /** "YYYY-MM-DD" */
  value?: string | null;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** Shows the clear control. Off for required dates. */
  clearable?: boolean;
  min?: string;
  max?: string;
  className?: string;
  "aria-invalid"?: boolean;
}

export function DatePicker({
  value,
  onChange,
  onBlur,
  id,
  placeholder,
  disabled,
  required,
  clearable = !required,
  min,
  max,
  className,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const { day, t } = useDateLocale();
  const [open, setOpen] = useState(false);
  const selected = parseIso(value);
  const minDate = parseIso(min);
  const maxDate = parseIso(max);
  const today = new Date();
  const todayAllowed = !(minDate && today < minDate) && !(maxDate && today > maxDate);

  const commit = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur?.();
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" id={id} disabled={disabled} aria-invalid={ariaInvalid} className={cn(triggerClass, className)}>
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn("min-w-0 flex-1 truncate", !selected && "text-text-disabled")}>
            {selected ? day(selected) : placeholder || t("date.select_date", "Select date")}
          </span>
          {clearable && selected && !disabled && (
            <ClearButton label={t("date.clear", "Clear")} onClear={() => onChange("")} />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[296px] p-3" onOpenAutoFocus={focusSelectedDay}>
        <Calendar selected={selected} min={minDate} max={maxDate} onSelect={(date) => commit(toIso(date))} />
        <PanelFooter
          clearLabel={t("date.clear", "Clear")}
          todayLabel={t("date.today", "Today")}
          onClear={clearable ? () => commit("") : undefined}
          onToday={todayAllowed ? () => commit(toIso(today)) : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}

interface MonthPickerProps {
  /** "YYYY-MM" */
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MonthPicker({ value, onChange, placeholder, disabled, className }: MonthPickerProps) {
  const { month, t } = useDateLocale();
  const [open, setOpen] = useState(false);
  const selected = parseIso(value);
  const [year, setYear] = useState(() => (selected ?? new Date()).getFullYear());

  const commit = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setYear((selected ?? new Date()).getFullYear());
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled} className={cn(triggerClass, className)}>
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn("min-w-0 flex-1 truncate", !selected && "text-text-disabled")}>
            {selected ? month(selected) : placeholder || t("date.select_month", "Select month")}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[264px] p-3">
        <MonthGrid
          year={year}
          onYearChange={setYear}
          selected={selected}
          min={null}
          max={null}
          onSelect={(nextMonth) => commit(`${year}-${pad(nextMonth + 1)}`)}
        />
        <PanelFooter todayLabel={t("date.this_month", "This month")} onToday={() => commit(toMonthValue(new Date()))} />
      </PopoverContent>
    </Popover>
  );
}

interface DateRangePickerProps {
  startDate?: string | null;
  endDate?: string | null;
  /** Fires when a range is finished (or cleared), so reports don't refetch on the first click. */
  onChange: (startDate: string, endDate: string) => void;
  placeholder?: string;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  placeholder,
  disabled,
  align = "start",
  className,
}: DateRangePickerProps) {
  const { day, t } = useDateLocale();
  const [open, setOpen] = useState(false);
  // Start date picked, end still pending.
  const [draftStart, setDraftStart] = useState<Date | null>(null);
  const start = parseIso(startDate);
  const end = parseIso(endDate);
  const hasValue = !!start || !!end;

  const label = hasValue
    ? `${start ? day(start) : "…"} – ${end ? day(end) : "…"}`
    : placeholder || t("date.select_range", "Select date range");

  const handleSelect = (date: Date) => {
    if (!draftStart) {
      setDraftStart(date);
      return;
    }
    const [from, to] = date < draftStart ? [date, draftStart] : [draftStart, date];
    onChange(toIso(from), toIso(to));
    setDraftStart(null);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next && draftStart) {
          // Closed after one click: keep it as an open-ended range.
          onChange(toIso(draftStart), "");
          setDraftStart(null);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled} className={cn(triggerClass, "w-auto", className)}>
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn("min-w-0 truncate tabular-nums", !hasValue && "text-text-disabled")}>{label}</span>
          {hasValue && !disabled && <ClearButton label={t("date.clear", "Clear")} onClear={() => onChange("", "")} />}
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-[296px] p-3" onOpenAutoFocus={focusSelectedDay}>
        <Calendar
          rangeStart={draftStart ?? start}
          rangeEnd={draftStart ? null : end}
          min={null}
          max={null}
          onSelect={handleSelect}
        />
        <PanelFooter
          clearLabel={t("date.clear", "Clear")}
          todayLabel={t("date.today", "Today")}
          onClear={
            hasValue || draftStart
              ? () => {
                  setDraftStart(null);
                  onChange("", "");
                  setOpen(false);
                }
              : undefined
          }
          onToday={() => {
            const today = toIso(new Date());
            setDraftStart(null);
            onChange(today, today);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
