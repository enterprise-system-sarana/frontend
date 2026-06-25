import { AppSidebar } from "@/components/layout/app-sidebar";
import { NavUser } from "@/components/layout/nav-user";
// import { ModeToggle } from "@/components/layout/mode-toggle";
// import { useCurrentUser } from "@/hooks/useAuth";

import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
    // //   const currentUser = useCurrentUser();
    //   const activeUser = currentUser
    //     ? {
    //         name: currentUser.username,
    //         email: currentUser.email,
    //         avatar: "",
    //       }
    //     : {
    //         name: "Guest",
    //         email: "guest@example.com",
    //         avatar: "",
    //       };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        {/* <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="#">
                                        Build Your Application
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb> */}
                    </div>
                    <div className="ml-auto flex items-center gap-2 px-4">
                        {/* <ModeToggle />
            <NavUser user={activeUser} /> */}
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Outlet />

                    {/*    <div className="grid auto-rows-min gap-4 md:grid-cols-3">*/}
                    {/*        <div className="aspect-video rounded-xl bg-muted/50" />*/}
                    {/*        <div className="aspect-video rounded-xl bg-muted/50" />*/}
                    {/*        <div className="aspect-video rounded-xl bg-muted/50" />*/}
                    {/*    </div>*/}
                    {/*    <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />*/}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default DashboardLayout;
