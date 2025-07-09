import type { IconProps } from './types';

export const TextIcon = ({ size }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.25}
    viewBox="0 0 24 24"
  >
    <path stroke="none" d="M0 0h24v24H0z" />
    <path d="M4 6h16M4 12h10M4 18h14" />
  </svg>
);
