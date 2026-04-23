import type { HelpChapter } from "../types";
import { sections as ch1 } from "./capitolo-1";
import { sections as ch2 } from "./capitolo-2";
import { sections as ch3 } from "./capitolo-3";
import { sections as ch4 } from "./capitolo-4";
import { sections as ch5 } from "./capitolo-5";

export const chapters: HelpChapter[] = [
  { number: 1, title: "Benvenuto", sections: ch1 },
  { number: 2, title: "Come sta andando la tua azienda", sections: ch2 },
  { number: 3, title: "Le tue scadenze e la tua cassa", sections: ch3 },
  { number: 4, title: "Operatività quotidiana", sections: ch4 },
  { number: 5, title: "Glossario", sections: ch5 },
];
