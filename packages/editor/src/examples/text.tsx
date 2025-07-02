/** @jsxRuntime classic */
/** @jsx jsx */

import {
  createHyperscript,
  type HyperscriptShorthands,
} from 'slate-hyperscript';
import { HeadingsPlugin } from '../plugins';

const elements: HyperscriptShorthands = {
  heading1: { type: HeadingsPlugin.HeadingLevel1 },
  heading2: { type: HeadingsPlugin.HeadingLevel2 },
  heading3: { type: HeadingsPlugin.HeadingLevel3 },
};

const jsx = createHyperscript({ elements });
jsx;

export const text = (
  <fragment>
    <heading1>Test</heading1>
    <heading2>Test</heading2>
  </fragment>
);
