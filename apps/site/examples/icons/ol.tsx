import type { IconProps } from './types';

export const OlIcon = ({ size }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="icon icon-tabler icons-tabler-outline icon-tabler-list-numbers"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M11 6h9" />
    <path d="M11 12h9" />
    <path d="M12 18h8" />
    <path d="M4 16a2 2 0 1 1 4 0c0 .591 -.5 1 -1 1.5l-3 2.5h4" />
    <path d="M6 10v-6l-2 2" />
  </svg>
);
