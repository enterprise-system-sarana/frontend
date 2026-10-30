import { useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
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
import { ROUTERS } from "@/constants/Route";

const isRouteActive = (pathname: string, url: string) =>
  url !== "#" && (pathname === url || pathname.startsWith(`${url}/`));

/** Most specific matching sub-route, so "/product/create" doesn't also light up "/product". */
const findActiveSubUrl = (pathname: string, subItems: { url: string }[] = []) =>
  subItems
    .filter((subItem) => isRouteActive(pathname, subItem.url))
    .sort((a, b) => b.url.length - a.url.length)[0]?.url;

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
        (subItem) => isRouteActive(location.pathname, subItem.url),
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
      "Catalog Setup": t("nav.settings"),
      Purchases: t("nav.purchases"),
      Supplier: t("nav.supplier"),
      Suppliers: t("nav.suppliers"),
      Purchase: t("nav.purchase"),
      "Create Purchase": t("nav.create_purchase"),
      "Purchase Payment": t("nav.purchase_payment"),
      Payments: t("nav.payments"),
      Inventory: t("nav.inventory"),
      Store: t("nav.store"),
      Stock: t("nav.stock"),
      Finance: t("nav.finance"),
      Bank: t("nav.bank"),
      Currency: t("nav.currency"),
      Security: t("nav.security"),
      People: t("nav.people"),
      User: t("nav.user"),
      Role: t("nav.role"),
      Sales: t("nav.sales"),
      "List Sales": t("nav.sales"),
      "Sales Return": t("nav.sales_return"),
      "Create Sale": t("sales.create_sale", "Create Sale"),
      "Cash Registers": t("nav.cash_registers", "Cash Registers"),
      Customer: t("nav.customer"),
      Customers: t("nav.customers"),
      Quotes: t("nav.quotes"),
      Quote: t("nav.quote"),
      "Create Quote": t("nav.create_quote"),
      "Group Permission": t("nav.group_permission"),
      "Permission Groups": t("nav.permission_groups"),
      "Role Permissions": t("nav.role_permissions"),
      "File Upload": t("nav.file_upload"),
      Reports: t("nav.reports"),
      "Daily Sales": t("nav.daily_sales"),
      "Monthly Sales": t("nav.monthly_sales"),
      "Sales Report": t("nav.sales_report"),
      "Sales Item Reports": t("nav.sales_items"),
      "Expense Reports": t("nav.expense_reports"),
      "Profit & Loss": t("nav.profit_loss"),
      "Product Serial Reports": t("nav.product_serials"),
      POS: t("nav.pos"),
      "POS Terminal": t("nav.pos"),
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


      {groupedItems.filter((group) => group.items.length > 0).map((group, groupIndex) => (
        <SidebarGroup
          key={group.label || groupIndex}
          className={`px-2 py-2 ${groupIndex > 0 ? "pt-3" : "pt-1"}`}
        >
          {group.label && (
            <SidebarGroupLabel className="reference-nav-label">
              {group.label}
            </SidebarGroupLabel>
          )}
          <SidebarMenu className="gap-0.5">
            {group.items.map((item) => {
              const hasSubItems = Boolean(item.items && item.items.length > 0);

              // Direct route check for items without children (e.g., Dashboard)
              const isDirectActive =
                !hasSubItems &&
                isRouteActive(location.pathname, item.url);

              const activeSubUrl = findActiveSubUrl(location.pathname, item.items);
              const hasActiveChild = Boolean(activeSubUrl);

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
                        group/btn relative h-9 rounded-lg px-3 text-sm font-medium
                        shadow-none transition-colors duration-150
                        ${isDirectActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold hover:bg-sidebar-primary hover:text-sidebar-primary-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                          : "bg-transparent text-sidebar-foreground/88 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        }
                      `}
                    >
                      <Link
                        to={item.url}
                        target={item.url === ROUTERS.SALE_CREATE ? "_blank" : undefined}
                        rel={item.url === ROUTERS.SALE_CREATE ? "noopener noreferrer" : undefined}
                        className="flex w-full items-center gap-3"
                      >
                        {ItemIcon && (
                          <ItemIcon
                            className={`h-5 w-5 shrink-0 transition-colors duration-200 ${isDirectActive
                              ? "text-sidebar-primary-foreground"
                              : "text-sidebar-foreground/80 group-hover/btn:text-sidebar-foreground"
                              }`}
                            strokeWidth={1.75}
                          />
                        )}
                        <span className="flex-1 truncate">
                          {translateTitle(item.title)}
                        </span>
                        {item.badge && (
                          <span className="flex h-[18px] min-w-5 items-center justify-center rounded-full bg-[#c10517] px-[7px] text-[12px] font-semibold text-white">
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
              // Open group: the active child carries the highlight. Closed group: the parent does.
              const isParentHighlighted = hasActiveChild && !isOpen;

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
                        isActive={isParentHighlighted}
                        className={`
                          group/btn relative h-9 rounded-lg px-3 text-sm font-medium
                          ${item.title === "Reports" ? "reference-reports-trigger" : ""}
                          shadow-none transition-colors duration-150
                          ${isParentHighlighted
                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold hover:bg-sidebar-primary hover:text-sidebar-primary-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                            : hasActiveChild
                              ? "bg-transparent text-sidebar-foreground font-semibold hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:bg-sidebar-primary"
                              : "bg-transparent text-sidebar-foreground/88 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          }
                        `}
                      >
                        {item.icon && (
                          <item.icon
                            className={`h-5 w-5 shrink-0 transition-colors duration-200 ${hasActiveChild
                              ? "text-sidebar-primary-foreground"
                              : "text-sidebar-foreground/80 group-hover/btn:text-sidebar-foreground"
                              }`}
                            strokeWidth={1.75}
                          />
                        )}
                        <span className="flex-1 truncate">
                          {translateTitle(item.title)}
                        </span>
                        {item.badge && (
                          <span className="flex h-[18px] min-w-5 items-center justify-center rounded-full bg-[#c10517] px-[7px] text-[12px] font-semibold text-white">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRightIcon
                          className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 ${hasActiveChild
                            ? "text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/60"
                            }`}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub className={`mt-1 ml-[21px] mr-0 gap-0.5 border-l border-sidebar-border py-0.5 pl-2.5 ${item.title === "Reports" ? "reference-reports-submenu" : ""}`}>
                        {item.items?.map((subItem) => {
                          const isActive = subItem.url === activeSubUrl;
                          const SubIcon = subItem.icon;

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              {/* Marks the active page on the tree line */}
                              {isActive && (
                                <span
                                  aria-hidden="true"
                                  className="absolute -left-[11.5px] top-1.5 bottom-1.5 w-[2px] rounded-full bg-sidebar-foreground"
                                />
                              )}
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive}
                                className={`
                                  h-8 rounded-lg px-2.5 text-[14px] font-medium shadow-none
                                  transition-colors duration-150
                                  ${isActive
                                    ? "bg-sidebar-primary text-sidebar-foreground font-semibold data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-foreground data-active:shadow-none"
                                    : "bg-transparent text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                  }
                                `}
                              >
                                <Link
                                  to={subItem.url}
                                  target={subItem.url === ROUTERS.SALE_CREATE ? "_blank" : undefined}
                                  rel={subItem.url === ROUTERS.SALE_CREATE ? "noopener noreferrer" : undefined}
                                  className="flex items-center gap-2.5"
                                >
                                  {SubIcon ? (
                                    <SubIcon
                                      className={`h-4 w-4 shrink-0 transition-colors duration-150 ${isActive
                                        ? "text-sidebar-foreground"
                                        : "text-sidebar-foreground/60"
                                        }`}
                                      strokeWidth={1.75}
                                    />
                                  ) : (
                                    <span
                                      className={`
                                        inline-flex h-[5px] w-[5px] shrink-0 rounded-full
                                        transition-all duration-150
                                        ${isActive
                                          ? "bg-sidebar-primary"
                                          : "border border-sidebar-foreground/40 bg-transparent"
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
