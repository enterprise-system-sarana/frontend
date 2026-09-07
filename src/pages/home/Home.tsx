import {
    ArrowDownRight,
    ArrowUpRight,
    Boxes,
    ChevronRight,
    CircleDollarSign,
    PackageCheck,
    Plus,
    ShoppingCart,
    TriangleAlert,
    Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTERS } from "@/constants/Route";
import { useAuth } from "@/store/useAuth";

const metrics = [
    {
        label: "Revenue this month",
        value: "$48,290",
        change: "+12.8%",
        note: "vs. last month",
        icon: CircleDollarSign,
        tone: "bg-[#e8f5ec] text-[#04912e]",
        positive: true,
    },
    {
        label: "Orders processed",
        value: "1,284",
        change: "+8.2%",
        note: "vs. last month",
        icon: ShoppingCart,
        tone: "bg-[#fff4df] text-[#c27600]",
        positive: true,
    },
    {
        label: "Active products",
        value: "486",
        change: "-2.4%",
        note: "vs. last month",
        icon: Boxes,
        tone: "bg-[#e8eef8] text-[#3d6091]",
        positive: false,
    },
    {
        label: "New customers",
        value: "92",
        change: "+18.6%",
        note: "vs. last month",
        icon: Users,
        tone: "bg-[#f9e8e5] text-[#b95442]",
        positive: true,
    },
];

const activity = [
    { title: "Sale #SL-1048 completed", detail: "Olivia Martin · 4 items", amount: "+$240.00", time: "12 min ago", color: "bg-[#e8f5ec] text-[#04912e]" },
    { title: "Purchase order received", detail: "TechSupply Co. · 28 items", amount: "+$1,820.00", time: "48 min ago", color: "bg-[#e8eef8] text-[#3d6091]" },
    { title: "New customer registered", detail: "Marcus Johnson · Business account", amount: "New", time: "2 hrs ago", color: "bg-[#fff4df] text-[#c27600]" },
    { title: "Sale #SL-1047 completed", detail: "Sophia Williams · 2 items", amount: "+$89.00", time: "3 hrs ago", color: "bg-[#e8f5ec] text-[#04912e]" },
];

const stock = [
    { name: "Wireless Keyboard", sku: "KB-2048", left: 4, total: 32 },
    { name: "USB-C Hub 7-in-1", sku: "HB-1190", left: 7, total: 40 },
    { name: "Ergonomic Mouse", sku: "MS-3021", left: 11, total: 64 },
];

export const HomePage = () => {
    const { user } = useAuth();
    const firstName = user?.username?.split(" ")[0] || "there";

    return (
        <main className="mx-auto w-full max-w-[1440px] space-y-6 pb-8">
            <section className="relative overflow-hidden rounded-[1.25rem] bg-[#173b2b] px-6 py-7 text-white shadow-sm sm:px-8 sm:py-8">
                <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[28px] border-white/5" />
                <div className="pointer-events-none absolute -bottom-32 right-32 h-52 w-52 rounded-full border-[18px] border-[#8cca9d]/10" />
                <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#a8d6b4]">Thursday, September 3, 2026</p>
                        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Good morning, {firstName}.</h1>
                        <p className="mt-2 max-w-md text-sm leading-6 text-[#c4dfca]">Here is the pulse of your business today. You have 3 items that need attention.</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <Link to={ROUTERS.PRODUCT_CREATE} className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#173b2b] transition-colors hover:bg-[#e8f5ec]"><Plus className="size-4" /> Add product</Link>
                        <Link to={ROUTERS.SALE_CREATE} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/25 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"><ShoppingCart className="size-4" /> New sale</Link>
                    </div>
                </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => {
                    const Icon = metric.icon;
                    return <article key={metric.label} className="rounded-xl border border-border/70 bg-card p-5 shadow-[0_2px_8px_rgba(42,30,18,0.03)]">
                        <div className="flex items-start justify-between"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{metric.label}</p><span className={`flex size-9 items-center justify-center rounded-lg ${metric.tone}`}><Icon className="size-[18px]" /></span></div>
                        <div className="mt-5 flex items-baseline gap-2"><p className="text-2xl font-bold tracking-tight text-foreground">{metric.value}</p><span className={`flex items-center text-xs font-bold ${metric.positive ? "text-[#04912e]" : "text-[#b95442]"}`}>{metric.positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{metric.change}</span></div>
                        <p className="mt-1 text-xs text-muted-foreground">{metric.note}</p>
                    </article>;
                })}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
                <article className="rounded-xl border border-border/70 bg-card p-5 sm:p-6">
                    <div className="flex items-start justify-between"><div><p className="text-base font-bold text-foreground">Revenue overview</p><p className="mt-1 text-xs text-muted-foreground">Monthly performance across all sales channels</p></div><button className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted">Last 7 months <ChevronRight className="ml-1 inline size-3" /></button></div>
                    <div className="mt-7 flex h-52 items-end gap-2 sm:gap-4">
                        {[54, 68, 48, 76, 62, 84, 72, 94, 78, 88, 71, 100].map((height, index) => <div key={index} className="group flex h-full flex-1 flex-col justify-end gap-2"><div className={`relative w-full rounded-t-md transition-all group-hover:bg-[#04912e] ${index === 11 ? "bg-[#04912e]" : "bg-[#d5e8d9]"}`} style={{ height: `${height}%` }}><span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-[#173b2b] px-1.5 py-1 text-[10px] font-semibold text-white group-hover:block">${Math.round(height * 480)}</span></div><span className="text-center text-[10px] text-muted-foreground">{["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"][index]}</span></div>)}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground"><span><i className="mr-2 inline-block size-2 rounded-full bg-[#04912e]" />Current month <strong className="ml-1 text-foreground">$48,290</strong></span><span><i className="mr-2 inline-block size-2 rounded-full bg-[#d5e8d9]" />Average <strong className="ml-1 text-foreground">$36,840</strong></span></div>
                </article>

                <article className="rounded-xl border border-border/70 bg-card p-5 sm:p-6">
                    <div className="flex items-start justify-between"><div><p className="text-base font-bold text-foreground">Inventory attention</p><p className="mt-1 text-xs text-muted-foreground">Products running low on stock</p></div><TriangleAlert className="size-5 text-[#c27600]" /></div>
                    <div className="mt-6 space-y-5">{stock.map((item) => <div key={item.sku}><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{item.name}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{item.sku}</p></div><span className="shrink-0 text-xs font-bold text-[#c27600]">{item.left} left</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f4ead5]"><div className="h-full rounded-full bg-[#e1a62f]" style={{ width: `${(item.left / item.total) * 100}%` }} /></div></div>)}</div>
                    <Link to={ROUTERS.STOCK} className="mt-6 flex items-center justify-center gap-1 border-t border-border/60 pt-4 text-xs font-bold text-[#04912e] hover:text-[#0aa63a]">View all inventory <ChevronRight className="size-3.5" /></Link>
                </article>
            </section>

            <section className="rounded-xl border border-border/70 bg-card p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-base font-bold text-foreground">Recent activity</p><p className="mt-1 text-xs text-muted-foreground">The latest movement in your store</p></div><Link to={ROUTERS.SALE} className="text-xs font-bold text-[#04912e] hover:text-[#0aa63a]">View all activity <ChevronRight className="ml-1 inline size-3.5" /></Link></div><div className="mt-5 divide-y divide-border/60">{activity.map((item) => <div key={item.title + item.time} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${item.color}`}><PackageCheck className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{item.title}</p><p className="truncate text-xs text-muted-foreground">{item.detail}</p></div><div className="hidden text-right sm:block"><p className="text-sm font-bold text-foreground">{item.amount}</p><p className="text-[11px] text-muted-foreground">{item.time}</p></div></div>)}</div></section>
        </main>
    );
};