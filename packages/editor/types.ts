export type CustomText = { text: string };

export type CustomElement = {
  type: string;
  children: (CustomElement | CustomText)[];
};
