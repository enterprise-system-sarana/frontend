import { ChevronRight, Home } from "lucide-react";
import { useEffect, useState } from "react";

const quickLinks = ["Sales", "Inventory", "Expenses", "Customers"];

export const HomePage = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsReady(true), 60);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main
      className={`dashboard-enter mx-auto w-full max-w-[1600px] px-0 pb-6 text-[#2b2f36] transition-all duration-700 ease-out ${
        isReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="mb-5 flex items-center justify-between px-0">
        <h1 className="text-[18px] font-bold tracking-[-0.02em] text-[#2b2f36] sm:text-[20px]">
          Dashboard
        </h1>

        <div className="flex items-center gap-2 text-[11px] font-medium text-[#7a7f88]">
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-[#2b2f36]">Dashboard</span>
        </div>
      </div>

      <section className="mb-6 rounded-[12px] border border-[#dfe4e8] bg-[#f4f5f5] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <div className="flex items-center gap-3">
          <div className="flex h-4 w-4 items-center justify-center rounded-[3px] bg-[#2f2f35] p-[2px]">
            <div className="grid h-full w-full grid-cols-2 gap-[2px]">
              <span className="rounded-[1px] bg-white" />
              <span className="rounded-[1px] bg-white" />
              <span className="rounded-[1px] bg-white" />
              <span className="rounded-[1px] bg-white" />
            </div>
          </div>
          <p className="text-[13px] font-black uppercase tracking-[0.02em] text-[#2d3036]">
            Quick Links
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((link, index) => (
            <div
              key={link}
              className="dashboard-card flex min-h-[82px] items-center justify-center rounded-[10px] border border-[#dfe3e8] bg-[#f9fafb] text-base font-semibold text-[#6a6f78] shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-sm"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              {link}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <article className="dashboard-card rounded-[12px] border border-[#dfe4e8] bg-[#f4f5f5] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-5" style={{ animationDelay: "120ms" }}>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-[14px] font-black uppercase tracking-[0.02em] text-[#2d3036]">
              Sales Chart
            </p>
          </div>

          <div className="relative h-[300px] rounded-[8px] border border-transparent bg-transparent">
            <div className="absolute left-0 top-0 bottom-0 w-[42px]">
              {["2000", "1500", "1000", "500", "0"].map((label) => (
                <div
                  key={label}
                  className="absolute left-0 flex h-0 w-full -translate-y-1/2 items-center justify-start text-[11px] text-[#7d828d]"
                  style={{ top: `${(label === "2000" ? 0 : label === "1500" ? 25 : label === "1000" ? 50 : label === "500" ? 75 : 100)}%` }}
                >
                  <span className="mr-2">{label}</span>
                </div>
              ))}
            </div>

            <div className="absolute left-[52px] right-0 top-0 bottom-0">
              <div className="absolute inset-0">
                {[0, 1, 2, 3, 4].map((row) => (
                  <div
                    key={row}
                    className="absolute left-0 right-0 border-t border-[#d8dfe5]"
                    style={{ top: `${(row / 4) * 100}%` }}
                  />
                ))}
              </div>

              <div className="absolute bottom-8 left-0 right-0 flex items-end justify-around gap-5 px-6">
                {[1400, 1100].map((value, index) => (
                  <div key={index} className="flex w-[38%] flex-col items-center">
                    <div
                      className="w-full rounded-t-[6px] bg-[#1fbf8f]"
                      style={{ height: `${value / 20}px` }}
                    />
                    <div className="mt-3 text-[11px] text-[#646b73]">
                      {index === 0 ? "Aug-2026" : "Sep-2026"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-center gap-6 text-[11px] text-[#4e535c]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-[#f4b93f]" />
              <span>Tax</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-[#f26d71]" />
              <span>Discount</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-[#1fbf8f]" />
              <span>Sales</span>
            </div>
          </div>
        </article>

        <article className="dashboard-card rounded-[12px] border border-[#dfe4e8] bg-[#f4f5f5] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-5" style={{ animationDelay: "180ms" }}>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-[14px] font-black uppercase tracking-[0.02em] text-[#2d3036]">
              Top Products <span className="normal-case">(September 2026)</span>
            </p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="relative h-[270px] w-[270px]">
              <div className="absolute inset-0 rounded-full bg-[conic-gradient(#f06a76_0deg_300deg,#f0f2f4_300deg_360deg)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]" />
              <div className="absolute inset-[23px] rounded-full bg-[#f4f5f5]" />
              <div className="absolute inset-[42px] rounded-full bg-[#f4f5f5]" />
              <div className="absolute left-1/2 top-1/2 h-[90%] w-[4px] -translate-x-1/2 -translate-y-1/2 rotate-[18deg] bg-[#f1f3f4]" />
            </div>

            <div className="mt-4 flex items-center gap-2 text-[12px] text-[#4e535c]">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-[#f06a76]" />
              <span>Galena Lang (Expedita illo exercit)</span>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
};
