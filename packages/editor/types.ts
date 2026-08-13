export type CustomText = { text: string };

export type CustomElement = {
  type: string;
  collapsed?: boolean;
  children: (CustomElement | CustomText)[];
};
