import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "@fontsource/outfit/800.css";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";

const PESOS = [
  "500 40px Outfit",
  "600 40px Outfit",
  "700 40px Outfit",
  "800 40px Outfit",
  "300 40px Inter",
  "400 40px Inter",
  "500 40px Inter",
  "600 40px Inter",
  "700 40px Inter",
];

// Segura a renderização até as fontes carregarem, evitando frames com fonte padrão.
export const useFonts = () => {
  const [handle] = useState(() => delayRender("Carregando fontes"));
  useEffect(() => {
    Promise.all(PESOS.map((f) => document.fonts.load(f)))
      .then(() => document.fonts.ready)
      .finally(() => continueRender(handle));
  }, [handle]);
};
