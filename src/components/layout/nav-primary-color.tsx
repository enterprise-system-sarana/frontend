import { useState } from "react";
import { Check, ChevronRightIcon, Palette, RotateCcw } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePrimaryColor } from "@/theme/PrimaryColorContext";
import { DEFAULT_PRIMARY_COLOR, INITIAL_CUSTOM_COLOR, type PrimaryColorSlot } from "@/theme/primaryColor";

export function NavPrimaryColor() {
  const { t } = useLanguage();
  const { state, isMobile, setOpen } = useSidebar();
  const { active, customColor, selectColor, changeCustomColor, resetCustomColor } = usePrimaryColor();
  const [isOpen, setIsOpen] = useState(false);

  const isCollapsed = state === "collapsed" && !isMobile;
  const title = t("theme.primary_color", "Primary color");
  const changeLabel = t("theme.change_color", "Change color");
  const resetLabel = t("theme.reset_color", "Reset color");
  const slots: { slot: PrimaryColorSlot; label: string }[] = [
    { slot: "default", label: t("theme.color_default", "Default color") },
    { slot: "custom", label: t("theme.color_custom", "Custom color") },
  ];

  return (
    <Collapsible
      asChild
      open={isOpen && !isCollapsed}
      onOpenChange={(nextOpen) => {
        // The sub tabs can't show on the icon rail, so expand the sidebar first.
        if (isCollapsed) setOpen(true);
        setIsOpen(isCollapsed || nextOpen);
      }}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={title}
            className="group/btn h-9 rounded-lg bg-transparent px-3 text-sm font-medium text-sidebar-foreground/88 shadow-none transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Palette
              className="h-5 w-5 shrink-0 text-sidebar-foreground/80 transition-colors duration-200 group-hover/btn:text-sidebar-foreground"
              strokeWidth={1.75}
            />
            <span className="flex-1 truncate">{title}</span>
            <ChevronRightIcon className="ml-auto h-4 w-4 shrink-0 text-sidebar-foreground/60 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub className="mt-1 ml-[21px] mr-0 gap-0.5 border-l border-sidebar-border py-0.5 pl-2.5">
            {slots.map(({ slot, label }) => {
              const isActive = slot === active;
              const isCustom = slot === "custom";
              return (
                <SidebarMenuSubItem key={slot} className="flex items-center gap-1">
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute -left-[11.5px] top-1.5 bottom-1.5 w-[2px] rounded-full bg-sidebar-foreground"
                    />
                  )}
                  <SidebarMenuSubButton
                    asChild
                    isActive={isActive}
                    className={`h-8 min-w-0 flex-1 rounded-lg px-2.5 text-[14px] font-medium shadow-none transition-colors duration-150 ${isActive
                      ? "bg-sidebar-primary font-semibold text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-foreground data-active:shadow-none"
                      : "bg-transparent text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      }`}
                  >
                    <button type="button" aria-pressed={isActive} onClick={() => selectColor(slot)} className="flex cursor-pointer items-center gap-2 text-left">
                      <span className="truncate">{label}</span>
                      {isActive && <Check className="ml-auto h-4 w-4 shrink-0 text-sidebar-foreground" />}
                    </button>
                  </SidebarMenuSubButton>

                  {isCustom && customColor !== INITIAL_CUSTOM_COLOR && (
                    <button
                      type="button"
                      title={resetLabel}
                      aria-label={`${resetLabel}: ${label}`}
                      onClick={resetCustomColor}
                      className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <span
                    className="relative size-6 shrink-0 rounded-md border border-sidebar-foreground/60 focus-within:ring-2 focus-within:ring-sidebar-ring"
                    style={{ backgroundColor: isCustom ? customColor : DEFAULT_PRIMARY_COLOR }}
                  >
                    {isCustom && (
                      <input
                        type="color"
                        value={customColor}
                        title={changeLabel}
                        aria-label={`${changeLabel}: ${label}`}
                        onChange={(event) => changeCustomColor(event.target.value)}
                        className="absolute inset-0 size-full cursor-pointer opacity-0"
                      />
                    )}
                  </span>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
