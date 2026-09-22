import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, PlayCircle, ShoppingCart, Clock } from "lucide-react";

export interface HeldOrder {
  id: string;
  createdAt: string;
  reference: string;
  customerId: number;
  customerName?: string;
  storeId: number;
  discount: number;
  grandTotal: number;
  items: any[];
}

interface PosHeldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldOrders: HeldOrder[];
  onRestore: (order: HeldOrder) => void;
  onDelete: (orderId: string) => void;
}

export default function PosHeldOrdersModal({
  isOpen,
  onClose,
  heldOrders,
  onRestore,
  onDelete,
}: PosHeldOrdersModalProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(val) || 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-white dark:bg-slate-900 border shadow-2xl rounded-2xl">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-base font-semibold flex items-center justify-between text-slate-800 dark:text-slate-100">
            <span className="flex items-center gap-2">
              <ShoppingCart className="size-4 text-orange-500" />
              Held Orders
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400">
              {heldOrders.length} Held
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {heldOrders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <Clock className="size-10 mx-auto opacity-30" />
              <p className="font-medium text-sm">No held orders found</p>
              <p className="text-xs">
                You can hold an active sale by clicking the "Hold" button in the order summary.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {heldOrders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {order.reference || "Order #" + order.id.slice(-4)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {order.createdAt}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Customer:{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {order.customerName || "Walk-in Customer"}
                      </span>
                      {" • "}
                      <span>{order.items.length} items</span>
                    </div>

                    <div className="text-sm font-bold text-teal-600 dark:text-teal-400">
                      {formatCurrency(order.grandTotal)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        onRestore(order);
                        onClose();
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 h-8 px-3"
                    >
                      <PlayCircle className="size-3.5" />
                      Restore
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(order.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 h-8 w-8"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3 shrink-0 rounded-b-2xl">
          <span className="text-xs text-muted-foreground">
            {heldOrders.length} order{heldOrders.length === 1 ? "" : "s"} on hold
          </span>
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={onClose}
            className="h-9 px-4 text-xs font-medium rounded-xl border-border/60 hover:bg-muted transition cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
