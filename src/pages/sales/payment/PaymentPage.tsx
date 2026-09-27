import { useMemo, useState } from "react";
import { Banknote, CalendarDays, CreditCard, Plus, Search, WalletCards, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { PageHeader } from "@/components/ui/page-header";
import { usePayment } from "@/hooks/sales/usePayment";
import type { PaymentResponse } from "@/types/sales/Payment";
import { useSearch } from "@/utils/useSearch";
import PaymentForm from "./PaymentForm";
import { PaymentColumns } from "./PaymentColumn";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { AccessDenied } from "@/components/ui/access-denied";
import { PageFilter } from "@/utils/PageFilter";

const formatCurrency = (value: number) => `$${(Number(value) || 0).toFixed(2)}`;

const PaymentPage = () => {
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.PAYMENT.CREATE);
    const canRead = Can(PERMISSION.PAYMENT.READ);
    const canUpdate = Can(PERMISSION.PAYMENT.UPDATE);
    const canDelete = Can(PERMISSION.PAYMENT.DELETE);

    const [open, setOpen] = useState(false);
    const [payment, setPayment] = useState<PaymentResponse | null>(null);
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const [method, setMethod] = useState("all");

    const { data, isError, isLoading } = usePayment.getAllPayments({ page, size });
    const { mutate: deletePayment } = usePayment.deletePayment();
    const allPayments = data?.payload?.data || [];
    const searchedPayments = useSearch<PaymentResponse>(allPayments, search, ["paymentNo", "paymentMethod", "saleNo", "status"]);
    const payments = useMemo(() => searchedPayments.filter((item) => method === "all" || item.paymentMethod?.toUpperCase() === method), [method, searchedPayments]);
    const totalAmount = allPayments.reduce((total, item) => total + (Number(item.amount) || 0), 0);
    const cashAmount = allPayments.filter((item) => item.paymentMethod?.toUpperCase() === "CASH").reduce((total, item) => total + (Number(item.amount) || 0), 0);
    const bankAmount = allPayments.filter((item) => item.paymentMethod?.toUpperCase() !== "CASH").reduce((total, item) => total + (Number(item.amount) || 0), 0);

    const columns = PaymentColumns({
        onEdit: (selected) => { if (canUpdate) { setPayment(selected); setOpen(true); } },
        onDelete: (id) => {
            if (!canDelete) return;
            const selected = allPayments.find((item) => item.id === id);
            if (selected) { setPayment(selected); setOpenConfirmDelete(true); }
        },
    });

    const clearFilters = () => { setSearch(""); setMethod("all"); setPage(1); };
    const hasFilters = Boolean(search || method !== "all");

    if (!canRead) return <AccessDenied resource="payments" showBackButton />;

    return (
        <div className="space-y-6 pb-8">
            <PageHeader
                title="Payments"
                // description="T/rack money received from sales and record new transactions."
                titleIcon={<WalletCards className="h-6 w-6 text-primary" />}
                buttonLabel="Record payment"
                buttonIcon={<Plus className="h-4 w-4" />}
                onCreate={canCreate ? () => { setPayment(null); setOpen(true); } : undefined}
                hideButton={!canCreate}
            />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card size="sm"><CardContent className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Payments shown</p><p className="mt-1 text-2xl font-bold">{allPayments.length}</p></div><div className="rounded-xl bg-primary/10 p-3 text-primary"><CreditCard className="h-5 w-5" /></div></CardContent></Card>
                <Card size="sm"><CardContent className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total received</p><p className="mt-1 text-2xl font-bold">{formatCurrency(totalAmount)}</p></div><div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600"><Banknote className="h-5 w-5" /></div></CardContent></Card>
                <Card size="sm"><CardContent className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cash</p><p className="mt-1 text-2xl font-bold">{formatCurrency(cashAmount)}</p></div><div className="rounded-xl bg-amber-500/10 p-3 text-amber-600"><Banknote className="h-5 w-5" /></div></CardContent></Card>
                <Card size="sm"><CardContent className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bank </p><p className="mt-1 text-2xl font-bold">{formatCurrency(bankAmount)}</p></div><div className="rounded-xl bg-sky-500/10 p-3 text-sky-600"><CalendarDays className="h-5 w-5" /></div></CardContent></Card>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-border/60">
                    <PageFilter
                        search={search}
                        onSearchChange={setSearch}
                        searchPlaceholder="Search payments..."
                        filterGroups={[
                            {
                                key: "method",
                                label: "Method",
                                options: [
                                    { label: "Cash", value: "CASH" },
                                    { label: "Bank", value: "BANK" },
                                ],
                            },
                        ]}
                        filterValues={{ method: method || "all" }}
                        onFilterChange={(key, val) => {
                            if (key === "method") setMethod(val || "all");
                            setPage(1);
                        }}
                        onReset={clearFilters}
                    />
                </div>

                <div className="px-0">
                    <QueryBoundary isLoading={isLoading} isError={isError}>
                        <DataTable columns={columns} data={payments} pagination={{
                            currentPage: page, pageSize: size,
                            totalElements: data?.payload?.pagination?.totalElements || payments.length,
                            totalPages: data?.payload?.pagination?.totalPages || 1,
                            onPageChange: setPage, onPageSizeChange: setSize,
                        }} />
                    </QueryBoundary>
                </div>
            </div>

            <PaymentForm open={open} setOpen={setOpen} payment={payment} />
            <ConfirmDelete isOpen={openConfirmDelete} setIsOpen={setOpenConfirmDelete} entityName="Payment" confirmDelete={() => {
                if (payment?.id) deletePayment({ id: payment.id }, { onSuccess: () => setOpenConfirmDelete(false) });
            }} />
        </div>
    );
};

export default PaymentPage;
