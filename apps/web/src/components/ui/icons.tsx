import type { SVGProps } from "react";

/** 16px line icons, 1.5 stroke, currentColor. Decorative unless given a title by the caller. */
type IconProps = SVGProps<SVGSVGElement>;

const Svg = ({ children, ...props }: IconProps) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
    {children}
  </svg>
);

export const CheckIcon = (p: IconProps) => <Svg {...p}><path d="M3.5 8.5l3 3 6-7" /></Svg>;
export const PlusIcon = (p: IconProps) => <Svg {...p}><path d="M8 3v10M3 8h10" /></Svg>;
export const LockIcon = (p: IconProps) => (
  <Svg {...p}><rect x="3.5" y="7" width="9" height="6.5" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 015 0v2" /></Svg>
);
export const SearchIcon = (p: IconProps) => <Svg {...p}><circle cx="7" cy="7" r="4" /><path d="M10 10l3 3" /></Svg>;
export const UploadIcon = (p: IconProps) => <Svg {...p}><path d="M8 10.5V3M5 6l3-3 3 3M3 11v1.5h10V11" /></Svg>;
export const BoltIcon = (p: IconProps) => <Svg {...p}><path d="M9 2L4 9h4l-1 5 5-7H8l1-5z" /></Svg>;
export const AlertIcon = (p: IconProps) => <Svg {...p}><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3.5M8 10.75v.25" /></Svg>;
export const MapIcon = (p: IconProps) => <Svg {...p}><path d="M2.5 4l3.5-1.5 4 1.5 3.5-1.5V12L10 13.5 6 12l-3.5 1.5V4zM6 2.5V12M10 4v9.5" /></Svg>;
export const ChevronRightIcon = (p: IconProps) => <Svg {...p}><path d="M6 3.5L10.5 8 6 12.5" /></Svg>;
export const TownIcon = (p: IconProps) => <Svg {...p}><path d="M2.5 13.5h11M3.5 13.5V7l3-2v8.5M6.5 13.5V3.5l4 2.5v7.5M10.5 8.5h2v5" /></Svg>;
