/** @jsxRuntime classic */
/** @jsx jsx */

import {
  createHyperscript,
  createText,
  type HyperscriptShorthands,
} from 'slate-hyperscript';
import { CodeBlockPlugin, HeadingsPlugin, ListsPlugin } from '../plugins';

const elements: HyperscriptShorthands = {
  paragraph: { type: 'paragraph' },
  heading1: { type: HeadingsPlugin.HeadingLevel1 },
  heading2: { type: HeadingsPlugin.HeadingLevel2 },
  heading3: { type: HeadingsPlugin.HeadingLevel3 },
  numberedList: { type: ListsPlugin.NUMBERED_LIST_ELEMENT },
  bulletedList: { type: ListsPlugin.BULLETED_LIST_ELEMENT },
  listItem: { type: ListsPlugin.LIST_ITEM_ELEMENT },
  codeBlock: { type: CodeBlockPlugin.CODE_ELEMENT },
  codeBlockLine: { type: CodeBlockPlugin.CODE_LINE_ELEMENT },
};

const creators = {
  htext: createText,
};

const jsx = createHyperscript({ elements, creators });

export const text = (
  <fragment>
    <heading1>About</heading1>
    <paragraph>
      <htext bold italic>
        Kona Editor
      </htext>{' '}
      is a text editor based on Slate.js that I use in Kona application for
      notes and event descriptions. I decided to open-source the editor for a
      few reasons:
    </paragraph>
    <numberedList>
      <listItem>
        I had a lot of <htext strikethrough>difficulties</htext> fun while
        building this editor and there were always not enough examples of how to
        do it right. I wanted to make a little contribution to the community, so
        others could use my code as a reference.
      </listItem>
      <listItem>
        I have always wanted to try to build something open-sourced, but there
        were not enough good ideas on what to build. I think that an editor is a
        pretty decent starting point.
      </listItem>
    </numberedList>
    <heading2>Usage</heading2>
    <codeBlock language="tsx">
      <codeBlockLine>{`import { KonaEditor } from '@kona/editor';`}</codeBlockLine>
      <codeBlockLine> </codeBlockLine>
      <codeBlockLine>{`const App = () => {`}</codeBlockLine>
      <codeBlockLine>{`  return (`}</codeBlockLine>
      <codeBlockLine>{`    <KonaEditor`}</codeBlockLine>
      <codeBlockLine>{`      initialValue={initialValue}`}</codeBlockLine>
      <codeBlockLine>{`      plugins={plugins}`}</codeBlockLine>
      <codeBlockLine>{`      onChange={handleChange}`}</codeBlockLine>
      <codeBlockLine>{`     />`}</codeBlockLine>
      <codeBlockLine>{`  )`}</codeBlockLine>
      <codeBlockLine>{`}`}</codeBlockLine>
    </codeBlock>
    <paragraph>
      Defining the list of plugins might be a little tricky, but I've tried to
      cover everything you'll need in docs.
    </paragraph>
  </fragment>
);
