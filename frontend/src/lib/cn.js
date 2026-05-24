import { twMerge } from "tailwind-merge";

export default function cn(...classes) {
  return twMerge(classes.filter(Boolean).join(" "));
}
