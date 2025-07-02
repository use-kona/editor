import type { CustomElement, CustomText } from '../../../types';

export type CodeElement = {
  language: string;
  children: CodeLineElement[];
} & CustomElement;

export type CodeLineElement = {
  children: CustomText[];
};
