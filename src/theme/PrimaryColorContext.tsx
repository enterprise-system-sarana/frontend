import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import {
  buildPrimaryColorCss,
  DEFAULT_PRIMARY_COLOR,
  INITIAL_CUSTOM_COLOR,
  isHexColor,
  type PrimaryColorSlot,
} from "./primaryColor";

interface PrimaryColorState {
  active: PrimaryColorSlot;
  customColor: string;
}

interface PrimaryColorContextType extends PrimaryColorState {
  selectColor: (slot: PrimaryColorSlot) => void;
  changeCustomColor: (color: string) => void;
  resetCustomColor: () => void;
}

const PrimaryColorContext = createContext<PrimaryColorContextType | undefined>(undefined);

const STATE_STORAGE_KEY = "app_primary_color";
// index.html reads this key to paint the saved colour before React loads.
const CSS_STORAGE_KEY = "app_primary_color_css";
const STYLE_ELEMENT_ID = "primary-color-theme";

const loadState = (): PrimaryColorState => {
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_STORAGE_KEY) ?? "{}");
    return {
      active: saved.active === "custom" ? "custom" : "default",
      customColor: isHexColor(saved.customColor) ? saved.customColor : INITIAL_CUSTOM_COLOR,
    };
  } catch {
    return { active: "default", customColor: INITIAL_CUSTOM_COLOR };
  }
};

const applyPrimaryColor = (color: string) => {
  const css = buildPrimaryColorCss(color);
  let style = document.getElementById(STYLE_ELEMENT_ID);
  if (!css) {
    style?.remove();
    localStorage.removeItem(CSS_STORAGE_KEY);
    return;
  }
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    document.head.appendChild(style);
  }
  style.textContent = css;
  localStorage.setItem(CSS_STORAGE_KEY, css);
};

export const PrimaryColorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PrimaryColorState>(loadState);
  const activeColor = state.active === "custom" ? state.customColor : DEFAULT_PRIMARY_COLOR;

  const update = (next: PrimaryColorState) => {
    setState(next);
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(next));
  };

  const selectColor = (slot: PrimaryColorSlot) => update({ ...state, active: slot });
  // Editing the custom colour also switches to it, so the change is visible straight away.
  const changeCustomColor = (color: string) => update({ active: "custom", customColor: color });
  const resetCustomColor = () => update({ ...state, customColor: INITIAL_CUSTOM_COLOR });

  useLayoutEffect(() => {
    applyPrimaryColor(activeColor);
  }, [activeColor]);

  // Keeps the POS tab in step with the tab where the colour was changed.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STATE_STORAGE_KEY) setState(loadState());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <PrimaryColorContext.Provider value={{ ...state, selectColor, changeCustomColor, resetCustomColor }}>
      {children}
    </PrimaryColorContext.Provider>
  );
};

export const usePrimaryColor = (): PrimaryColorContextType => {
  const context = useContext(PrimaryColorContext);
  if (!context) {
    throw new Error("usePrimaryColor must be used within a PrimaryColorProvider");
  }
  return context;
};
