import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSale } from "@/hooks/sales/useSale";
import { ROUTERS } from "@/constants/Route";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { QueryBoundary } from "@/components/ui/query-boundary";

const SaleCompletePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: saleData, isLoading, isError } = useSale.GetSaleById(Number(id), { enabled: !!id });
  const { mutate: completeSaleMutate } = useSale.Complete();
  const [confirm, setConfirm] = useState(false);

  const handleComplete = () => {
    if (!id) return;
    completeSaleMutate(Number(id), {
      onSuccess: () => navigate(ROUTERS.SALE),
    });
  };

  return (
    <>
      <PageHeader title="Complete Sale" />
      <QueryBoundary isLoading={isLoading} isError={isError}>
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sale Reference</label>
            <Input value={saleData?.payload?.data?.reference ?? ""} disabled />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={confirm}
              onChange={e => setConfirm(e.target.checked)}
              id="confirm-complete"
            />
            <label htmlFor="confirm-complete" className="text-sm font-medium">
              I confirm this sale is fully paid and should be marked as Completed.
            </label>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => navigate(ROUTERS.SALE)}>
              Cancel
            </Button>
            <Button disabled={!confirm} onClick={handleComplete}>
              Confirm Complete
            </Button>
          </div>
        </div>
      </QueryBoundary>
    </>
  );
};

export default SaleCompletePage;
