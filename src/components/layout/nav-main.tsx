import { useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronRightIcon, type LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    badge?: string;
    sectionLabel?: string;
    items?: {
      title: string;
      url: string;
      icon?: LucideIcon;
    }[];
  }[];
}) {
  const location = useLocation();
  const { t } = useLanguage();

  // Find the menu item that contains the currently active route
  const activeMenuTitle =
    items.find((item) =>
      item.items?.some(
        (subItem) =>
          location.pathname === subItem.url ||
          location.pathname.startsWith(subItem.url),
      ),
    )?.title || null;

  // Single open menu state (accordion behavior)
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(
    activeMenuTitle,
  );

  // Keep open menu in sync when route changes
  useEffect(() => {
    if (activeMenuTitle) {
      setOpenMenuKey(activeMenuTitle);
    }
  }, [location.pathname, activeMenuTitle]);

  const translateTitle = (title: string) => {
    const map: Record<string, string> = {
      Dashboard: t("nav.dashboard"),
      Products: t("nav.products"),
      "List Product": t("nav.list_product"),
      Product: t("nav.product"),
      "Create Product": t("nav.create_product"),
      "Edit Product": t("nav.edit_product"),
      Category: t("nav.category"),
      Brand: t("nav.brand"),
      Model: t("nav.model"),
      "Variant Type": t("nav.variant_type"),
      "Variant Value": t("nav.variant_value"),
      SubCategory: t("nav.sub_category"),
      Unit: t("nav.unit"),
      Expenses: t("nav.expenses"),
      Expense: t("nav.expense"),
      "Expense Type": t("nav.expense_type"),
      Setting: t("nav.settings"),
      Settings: t("nav.settings"),
      Purchases: t("nav.purchases"),
      Supplier: t("nav.supplier"),
      Purchase: t("nav.purchase"),
      "Create Purchase": t("nav.create_purchase"),
      "Purchase Payment": t("nav.purchase_payment"),
      Inventory: t("nav.inventory"),
      Store: t("nav.store"),
      Stock: t("nav.stock"),
      Finance: t("nav.finance"),
      Bank: t("nav.bank"),
      Currency: t("nav.currency"),
      Security: t("nav.security"),
      User: t("nav.user"),
      Role: t("nav.role"),
      "Sales": t("nav.sales"),
      "Customer": t("nav.customer"),
      "Quotes": t("nav.quotes"),
      "Quote": t("nav.quote"),
      "Create Quote": t("nav.create_quote"),
      "Group Permission": t("nav.group_permission"),
      "Permission Groups": t("nav.permission_groups"),
      "Role Permissions": t("nav.role_permissions"),
      "File Upload": t("nav.file_upload"),
    };
    return map[title] || title;
  };

  // Group items by section label
  const groupedItems: {
    label: string;
    items: typeof items;
  }[] = [];

  let currentGroup = { label: "", items: [] as typeof items };
  items.forEach((item) => {
    if (item.sectionLabel) {
      groupedItems.push(currentGroup);
      currentGroup = { label: item.sectionLabel, items: [] };
    }
    currentGroup.items.push(item);
  });
  groupedItems.push(currentGroup);

  return (
    <>
      {groupedItems.map((group) => (
        <SidebarGroup key={group.label} className="space-y-0.5 py-1">
          <SidebarMenu className="space-y-0.5">
            {group.items.map((item) => {
              const hasSubItems = Boolean(item.items && item.items.length > 0);

              // Direct route check for items without children (e.g., Dashboard)
              const isDirectActive =
                !hasSubItems &&
                (location.pathname === item.url ||
                  (item.url !== "#" && location.pathname.startsWith(item.url)));

              const hasActiveChild = item.items?.some(
                (subItem) =>
                  location.pathname === subItem.url ||
                  location.pathname.startsWith(subItem.url),
              );

              // ----------------------------------------------------
              // 1. RENDER DIRECT LINK (FOR ITEMS WITHOUT SUB-ITEMS)
              // ----------------------------------------------------
              if (!hasSubItems) {
                const ItemIcon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={translateTitle(item.title)}
                      isActive={isDirectActive}
                      className={`
                        group/btn relative mx-1 h-/[42px] rounded-xl px-3 text-[14px] font-medium
                        shadow-none transition-all duration-200
                        ${isDirectActive
                          ? "bg-primary/12 text-primary font-semibold before:absolute before:left-0 before:top-1/2 before:h-/[24px] before:w-[3.5px] before:-translate-y-1/2 before:rounded-r-full before:bg-primary before:content-['']"
                          : "bg-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        }
                      `}
                    >
                      <Link to={item.url} className="flex items-center gap-2.5 w-full">
                        {ItemIcon && (
                          <ItemIcon
                            className={`h-5 w-5 shrink-0 ${isDirectActive
                              ? "text-primary"
                              : "text-sidebar-foreground/60 group-hover/btn:text-sidebar-foreground"
                              }`}
                            strokeWidth={1.75}
                          />
                        )}
                        <span className="flex-1 truncate">
                          {translateTitle(item.title)}
                        </span>
                        {item.badge && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              // ----------------------------------------------------
              // 2. RENDER COLLAPSIBLE DROPDOWN (FOR ITEMS WITH SUB-ITEMS)
              // ----------------------------------------------------
              const isOpen = openMenuKey === item.title;

              return (
                <Collapsible
                  key={item.title}
                  asChild
                  open={isOpen}
                  onOpenChange={(nextOpen) => {
                    setOpenMenuKey(nextOpen ? item.title : null);
                  }}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={translateTitle(item.title)}
                        isActive={Boolean(hasActiveChild)}
                        className={`
                          group/btn relative mx-1 h-/[42px] rounded-xl px-3 text-[14px] font-medium
                          shadow-none transition-all duration-200
                          ${hasActiveChild
                            ? "bg-primary/12 text-primary font-semibold before:absolute before:left-0 before:top-1/2 before:h-/[24px] before:w-[3.5px] before:-translate-y-1/2 before:rounded-r-full before:bg-primary before:content-['']"
                            : "bg-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          }
                        `}
                      >
                        {item.icon && (
                          <item.icon
                            className={`h-5 w-5 shrink-0 ${hasActiveChild
                              ? "text-primary"
                              : "text-sidebar-foreground/60 group-hover/btn:text-sidebar-foreground"
                              }`}
                            strokeWidth={1.75}
                          />
                        )}
                        <span className="flex-1 truncate">
                          {translateTitle(item.title)}
                        </span>
                        {item.badge && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRightIcon
                          className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 ${hasActiveChild
                            ? "text-primary"
                            : "text-sidebar-foreground/40"
                            }`}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub className="mt-0.5 ml-/[18px] border-l border-border/40 py-0.5 pl-3">
                        {item.items?.map((subItem) => {
                          const isActive =
                            location.pathname === subItem.url ||
                            location.pathname.startsWith(subItem.url);
                          const SubIcon = subItem.icon;

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive}
                                className={`
                                  h-/[34px] rounded-lg px-2.5 text-[13px] font-medium
                                  transition-all duration-150
                                  ${isActive
                                    ? "bg-primary/8 text-primary font-semibold"
                                    : "bg-transparent text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                  }
                                `}
                              >
                                <Link
                                  to={subItem.url}
                                  className="flex items-center gap-2.5"
                                >
                                  {SubIcon ? (
                                    <SubIcon
                                      className={`h-4 w-4 shrink-0 transition-colors duration-150 ${isActive
                                        ? "text-primary"
                                        : "text-sidebar-foreground/45"
                                        }`}
                                      strokeWidth={1.75}
                                    />
                                  ) : (
                                    <span
                                      className={`
                                        inline-flex h-/[5px] w-/[5px] shrink-0 rounded-full
                                        transition-all duration-150
                                        ${isActive
                                          ? "bg-primary"
                                          : "border border-sidebar-foreground/35 bg-transparent"
                                        }
                                      `}
                                    />
                                  )}
                                  <span className="truncate">
                                    {translateTitle(subItem.title)}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}