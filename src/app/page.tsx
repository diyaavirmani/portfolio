import { Caveat, Fraunces, Nunito_Sans, Pixelify_Sans } from "next/font/google";
import Desk from "./_desk/desk";
import VisitTracker from "./_desk/visit-tracker";

const display = Fraunces({ subsets: ["latin"], axes: ["SOFT", "opsz"], variable: "--desk-display", display: "swap" });
const body = Nunito_Sans({ subsets: ["latin"], variable: "--desk-body", display: "swap" });
const pixel = Pixelify_Sans({ subsets: ["latin"], variable: "--desk-pixel", display: "swap" });
const hand = Caveat({ subsets: ["latin"], variable: "--desk-hand", display: "swap" });

export default function Page() {
  return <div className={`${display.variable} ${body.variable} ${pixel.variable} ${hand.variable}`}>
    <Desk />
    <VisitTracker />
  </div>;
}
