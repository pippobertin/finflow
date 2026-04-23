import type { HelpChapter } from "../types";
import { sections as ch1 } from "./capitolo-1";
import { sections as ch2 } from "./capitolo-2";
import { sections as ch3 } from "./capitolo-3";
import { sections as ch4 } from "./capitolo-4";
import { sections as ch5 } from "./capitolo-5";
import { sections as ch6 } from "./capitolo-6";
import { sections as ch7 } from "./capitolo-7";
import { sections as ch8 } from "./capitolo-8";

export const chapters: HelpChapter[] = [
  { number: 1, title: "Primi passi", sections: ch1 },
  { number: 2, title: "Gestione studio e clienti", sections: ch2 },
  { number: 3, title: "Bilanci e piano dei conti", sections: ch3 },
  { number: 4, title: "Budget e preconsuntivo", sections: ch4 },
  { number: 5, title: "IVA, F24, prestiti", sections: ch5 },
  { number: 6, title: "Estratti conto e movimenti", sections: ch6 },
  { number: 7, title: "Report e comunicazione con il cliente", sections: ch7 },
  { number: 8, title: "Troubleshooting e FAQ", sections: ch8 },
];
