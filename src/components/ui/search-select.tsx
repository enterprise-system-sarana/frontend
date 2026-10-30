import * as React from "react"
import { Check, ChevronDown, Search, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface SearchSelectOption {
  value: string
  label: string
  /** Second line under the label; also matched by the search (e.g. a phone number). */
  description?: string
  /** Leading visual such as an avatar. */
  leading?: React.ReactNode
}

interface SearchSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SearchSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  /** Icon shown at the start of the trigger. */
  icon?: LucideIcon
  className?: string
  "aria-label"?: string
}

/** Select with a search box — for long lists such as customers. Styled to match the shared Select. */
export function SearchSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results",
  icon: Icon,
  className,
  "aria-label": ariaLabel,
}: SearchSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const listId = React.useId()

  const selected = options.find((option) => option.value === value)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((option) => `${option.label} ${option.description ?? ""}`.toLowerCase().includes(q))
  }, [options, query])

  React.useEffect(() => {
    if (!open) return
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [activeIndex, open])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setQuery("")
      setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)))
    }
  }

  const choose = (option: SearchSelectOption) => {
    onValueChange(option.value)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const option = filtered[activeIndex]
      if (option) choose(option)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={ariaLabel}
          className={cn(
            "flex h-10 w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-[14px] text-foreground shadow-2xs outline-none",
            "transition-[border-color,box-shadow] duration-150 ease-out hover:border-primary/40",
            "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 data-[state=open]:border-primary data-[state=open]:ring-3 data-[state=open]:ring-primary/15",
            className
          )}
        >
          {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
          <span className={cn("min-w-0 flex-1 truncate", !selected && "text-text-disabled")}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-150", open && "rotate-180")}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-64 p-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          inputRef.current?.focus()
        }}
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            aria-controls={listId}
            aria-activedescendant={filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined}
            className="h-10 w-full min-w-0 bg-transparent text-[14px] text-foreground outline-none placeholder:text-text-disabled"
          />
        </div>

        <div ref={listRef} id={listId} role="listbox" className="max-h-72 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-[14px] text-muted-foreground">{emptyText}</p>
          ) : (
            filtered.map((option, index) => {
              const isSelected = option.value === value
              return (
                <div
                  key={option.value}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] text-foreground",
                    index === activeIndex && "bg-muted"
                  )}
                >
                  {option.leading}
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate leading-5", isSelected && "font-medium")}>{option.label}</span>
                    {option.description && (
                      <span className="block truncate text-[13px] leading-[18px] text-muted-foreground tabular-nums">
                        {option.description}
                      </span>
                    )}
                  </span>
                  {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
