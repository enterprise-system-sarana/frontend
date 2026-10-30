import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTERS } from "@/constants/Route";
import { useLanguage } from "@/i18n/LanguageContext";

/** Saw-tooth tear along the bottom of the receipt. */
const TORN_EDGE: React.CSSProperties = {
  maskImage:
    "linear-gradient(#000 0 0), conic-gradient(from -45deg at 50% 100%, #0000, #000 1deg 89deg, #0000 90deg)",
  maskSize: "100% calc(100% - 8px), 16px 8px",
  maskPosition: "top, bottom",
  maskRepeat: "no-repeat, repeat-x",
};

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-foreground" title={value}>
        {value}
      </span>
    </div>
  );
}

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[calc(100vh-140px)] w-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-[380px]">
        {/* drop-shadow follows the torn edge; box-shadow would be clipped by the mask */}
        <div className="drop-shadow-[0_8px_16px_rgba(11,44,82,0.10)]">
          <div className="bg-card px-7 pt-8 pb-10" style={TORN_EDGE}>
            <p className="text-center text-sm font-semibold text-muted-foreground">
              {t("error.receipt_title", "Page receipt")}
            </p>
            <p className="mt-3 text-center text-[88px] leading-none font-bold tracking-[-0.03em] text-primary tabular-nums">
              404
            </p>

            <div className="my-6 border-t border-dashed border-border-strong" />

            <div className="space-y-2.5">
              <ReceiptRow label={t("error.receipt_requested", "Requested")} value={pathname} />
              <ReceiptRow label={t("error.receipt_status", "Status")} value={t("error.receipt_not_found", "Not found")} />
              <ReceiptRow label={t("error.receipt_items", "Items found")} value="0" />
            </div>

            <div className="my-6 border-t border-dashed border-border-strong" />

            <h1 className="text-center text-xl leading-7 font-semibold text-foreground">
              {t("error.not_found_title", "This page isn't here")}
            </h1>
            <p className="mt-1.5 text-center text-sm text-muted-foreground">
              {t("error.not_found_desc", "The link may be old, or the page may have moved.")}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2.5">
          <Button variant="outline" size="lg" className="flex-1" onClick={() => navigate(-1)}>
            <ArrowLeft />
            {t("error.go_back", "Go Back")}
          </Button>
          <Button size="lg" className="flex-1" onClick={() => navigate(ROUTERS.DASHBOARD)}>
            <Home />
            {t("error.back_dashboard", "Dashboard")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
