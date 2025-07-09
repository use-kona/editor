import { IconProps } from './types';

export const UnderlineIcon = ({ size }: IconProps) => (
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
    className="icon icon-tabler icons-tabler-outline icon-tabler-underline"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M7 5v5a5 5 0 0 0 10 0v-5" />
    <path d="M5 19h14" />
  </svg>
);
