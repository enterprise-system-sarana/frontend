"use client"
import * as React from "react"
import {
    AudioWaveform,
    BookOpen,
    Bot,
    Command,
    Frame,
    GalleryVerticalEnd,
    Map,
    PieChart,
    Settings2,
    SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/layout/nav-main"
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
} from "@/components/ui/sidebar";
import { PERMISSION } from "@/constants/Permission";
import { usePermission } from "@/utils/UsePermission";

const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },

    navMain: [
        {
            title: "Products",
            url: "#",
            icon: Package,
            isActive: true,
            items: [
                {
                    title: "Category",
                    url: "/category",
                    icon: LayoutGrid,
                    permission: PERMISSION.CATEGORY.READ,
                },
                {
                    title: "SubCategory",
                    url: "/sub-category",
                    icon: Layers,
                    permission: PERMISSION.PRODUCT.READ,
                },
                {
                    title: "Settings",
                    url: "#",
                },
            ],
        },
        {
            title: "Purchases",
            url: "#",
            icon: ShoppingCart,
            items: [
                {
                    title: "Genesis",
                    url: "#",
                },
                {
                    title: "Explorer",
                    url: "#",
                },
                {
                    title: "Quantum",
                    url: "#",
                },

            ],
        },
        {
            title: "Security",
            url: "#",
            icon: Shield,
            items: [
                {
                    title: "User",
                    url: "/users",
                    icon: User,
                    permission: PERMISSION.USER.READ
                },
                {
                    title: "Role",
                    url: "/roles",
                    icon: UserCog,
                    permission: PERMISSION.ROLE.READ
                },
                {
                    title: "Permission Groups",
                    url: "/permission-groups",
                    icon: Shield,
                    permission: PERMISSION.PERMISSION_GROUP.READ
                },
                {
                    title: "Role Permissions",
                    url: "/role-permissions",
                    icon: Key,
                    permission: PERMISSION.PERMISSION.READ
                },
            ],
        },

        // inventory 
        {
            title: "Inventory",
            url: "#",
            icon: Warehouse,
            items: [
                {
                    title: "Store",
                    url: "/store",
                    icon: Store,
                    permission: PERMISSION.STORE.READ,
                },
                {
                    title: "Stock",
                    url: "/stock",
                    icon: Boxes,
                    permission: PERMISSION.STOCK.READ,
                },
            ],
        },

    ],
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { Can } = usePermission()

    // Filter navigation main menu items based on permissions
    const filteredNavMain = data.navMain
        .map((group) => {
            const filteredItems = group.items?.filter((subItem: any) => {
                return !subItem.permission || Can(subItem.permission)
            })
            return { ...group, items: filteredItems }
        })
        .filter((group) => !group.items || group.items.length > 0)
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <img src="/logo-sarana.png" alt="logo" className="w-full h-full object-cover" />
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavMain} />
            </SidebarContent>
        </Sidebar>
    )
}
