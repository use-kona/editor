export type CustomText = { text: string };

export type CustomElement = {
  type: string;
  collapsed?: boolean;
  start?: number;
  children: (CustomElement | CustomText)[];
};
