import { AppSidebar } from "@/components/layout/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/useAuth";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Search, Mail, Bell, ChevronDown, LogOut, BadgeCheck, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/store/store";
import { logout } from "@/store/authSlice";
import { AuthService } from "@/services/auth/auth.service";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div
            className="flex items-center gap-0.5 bg-muted p-1 rounded-full border border-border/80 cursor-pointer select-none transition-colors duration-200"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
            <div className={`p-1.5 rounded-full transition-all duration-300 ${theme !== 'dark' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                <Sun className="h-3.5 w-3.5" />
            </div>
            <div className={`p-1.5 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                <Moon className="h-3.5 w-3.5" />
            </div>
        </div>
    );
};

const DashboardLayout = () => {
    const { user } = useAuth();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [currentDateString, setCurrentDateString] = useState("");

    useEffect(() => {
        const day = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        setCurrentDateString(`${weekday}, ${day}`);
    }, []);

    const activeUser = user
        ? {
            name: user.username,
            email: user.email,
            avatar: "",
        }
        : {
            name: "Guest User",
            email: "guest@example.com",
            avatar: "",
        };

    const handleLogout = async () => {
        try {
            await AuthService.logout();
        } catch (err) {
            console.error("Failed to log out from backend:", err);
        }
        dispatch(logout());
        navigate("/login");
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-20 shrink-0 items-center justify-between gap-4 border-b border-border/50 bg-background/95 backdrop-blur px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16 sticky top-0 z-10">
                    {/* Left side: Sidebar Trigger + User Welcome Info */}
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground hover:bg-muted" />
                        <Separator
                            orientation="vertical"
                            className="h-6 bg-border"
                        />
                        <div className="flex flex-col">
                            <h1 className="text-sm font-semibold tracking-tight text-foreground md:text-base leading-none">
                                Welcome Back, {activeUser.name}
                            </h1>
                            {currentDateString && (
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    {currentDateString}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right side: Search, Theme, Icons, User Menu */}
                    <div className="flex items-center gap-3">
                        {/* Search Input */}
                        {/* <div className="relative hidden md:block w-48 lg:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search"
                                className="w-full pl-9 pr-4 h-9 rounded-full bg-card border border-border/80 shadow-sm focus-visible:ring-primary text-xs"
                            />
                        </div> */}

                        {/* Theme Toggle */}
                        {/* <ThemeToggle /> */}

                        {/* Mail/Envelope Button
                        <button className="h-9 w-9 flex items-center justify-center rounded-full bg-card border border-border/80 text-muted-foreground hover:text-foreground cursor-pointer transition-colors shadow-sm hover:bg-muted/50">
                            <Mail className="h-4 w-4" />
                        </button> */}

                        {/* Notification/Bell Button */}
                        {/* <button className="h-9 w-9 flex items-center justify-center rounded-full bg-card border border-border/80 text-muted-foreground hover:text-foreground cursor-pointer transition-colors shadow-sm hover:bg-muted/50 relative">
                            <Bell className="h-4 w-4" />
                            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-destructive" />
                        </button> */}

                        {/* Divider */}
                        <Separator
                            orientation="vertical"
                            className="h-6 bg-border hidden sm:block"
                        />

                        {/* User dropdown pill */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex items-center gap-2 p-1 pr-3 rounded-full border border-border/85 bg-card shadow-sm cursor-pointer hover:bg-muted/50 transition-all select-none">
                                    <Avatar className="h-7 w-7 rounded-full border border-border/50">
                                        <AvatarImage src={activeUser.avatar} alt={activeUser.name} />
                                        <AvatarFallback className="rounded-full bg-primary/10 text-primary font-medium text-[10px]">
                                            {activeUser.name.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-semibold text-foreground truncate max-w-[120px] hidden sm:inline-block">
                                        {activeUser.name}
                                    </span>
                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-semibold leading-none">{activeUser.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{activeUser.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/profile")}>
                                        <BadgeCheck className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/settings")}>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        <span>Billing</span>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-6">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default DashboardLayout;
