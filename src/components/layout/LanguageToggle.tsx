import { useLanguage, type Language } from "@/i18n/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string; flagImg: string }[] = [
    { code: "en", label: "English", flagImg: "/flags/gb.png" },
    { code: "km", label: "ភាសាខ្មែរ", flagImg: "/flags/kh.png" },
  ];

  const activeLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/60 bg-card shadow-2xs cursor-pointer hover:bg-muted/60 transition-all select-none text-xs font-semibold text-foreground">
          <img
            src={activeLang.flagImg}
            alt={activeLang.label}
            className="w-4.5 h-3 object-cover rounded-xs shadow-xs border border-border/40 shrink-0"
          />
          <span className="uppercase text-[11px] font-bold tracking-wider">{activeLang.code}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-38 rounded-xl border-border/60 shadow-lg">
        {languages.map((item) => (
          <DropdownMenuItem
            key={item.code}
            onClick={() => setLanguage(item.code)}
            className="flex items-center justify-between cursor-pointer text-xs rounded-lg py-2"
          >
            <div className="flex items-center gap-2.5">
              <img
                src={item.flagImg}
                alt={item.label}
                className="w-5 h-3.5 object-cover rounded-xs shadow-xs border border-border/40 shrink-0"
              />
              <span className={item.code === "km" ? "font-sans font-medium text-[13px]" : "font-sans"}>
                {item.label}
              </span>
            </div>
            {language === item.code && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
