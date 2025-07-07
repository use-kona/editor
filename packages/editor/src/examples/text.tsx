/** @jsxRuntime classic */
/** @jsx jsx */

import {
  createHyperscript,
  createText,
  type HyperscriptShorthands,
} from 'slate-hyperscript';
import {
  CodeBlockPlugin,
  HeadingsPlugin,
  LinksPlugin,
  ListsPlugin,
} from '../plugins';

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
  hlink: { type: LinksPlugin.LINK_TYPE },
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
      is a text editor based on Slate.js that I use in{' '}
      <hlink url="https://kona.to">Kona calendar</hlink> for notes and event
      descriptions. I decided to open-source the editor for a few reasons:
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
        have not been enough good ideas on what to build. I think that an editor
        is a pretty decent starting point.
      </listItem>
    </numberedList>
    <heading2>Usage</heading2>
    <codeBlock language="tsx">
      <codeBlockLine>{`import { KonaEditor } from '@use-kona/editor';`}</codeBlockLine>
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
    <heading2>List of plugins</heading2>
    <heading3>BasicFormattingPlugin</heading3>
    <paragraph>
      Allows to use <htext bold>bold</htext>, <htext italic>italic</htext>,{' '}
      <htext underline>underlined</htext> and{' '}
      <htext strikethrough>strikethrough</htext> text
    </paragraph>

    <heading3>BreaksPlugin</heading3>
    <paragraph>
      Overrides default Slate behavior by breaking custom block types when user
      presses Enter.
    </paragraph>

    <heading3>CodeBlockPlugin</heading3>
    <paragraph>Adds support for code blocks.</paragraph>

    <heading3>CommandsPlugin</heading3>
    <paragraph>Adds Notion-style menu with custom list of commands</paragraph>

    <heading3>DnDPlugin</heading3>
    <paragraph>Allows reordering blocks by drag'n'dropping them</paragraph>

    <heading3>FloatingMenuPlugin</heading3>
    <paragraph>Adds menu which is shown when user selects a text</paragraph>

    <heading3>HeadingsPlugin</heading3>
    <paragraph>Adds three levels of headings</paragraph>

    <heading3>HighlightsPlugin</heading3>
    <paragraph>Allows highlighting selected text with a custom color</paragraph>

    <heading3>LinksPlugin</heading3>
    <paragraph>
      Gives user ability to convert the selected text into a link
    </paragraph>

    <heading3>MenuPlugin</heading3>
    <paragraph>Adds pinned to the top menu with custom commands</paragraph>

    <heading3>NodeIdPlugin</heading3>
    <paragraph>Assigns a unique id to each block</paragraph>

    <heading3>PlaceholderPlugin</heading3>
    <paragraph>
      Allows to setup a custom placeholder for the selected line
    </paragraph>

    <heading3>ShortcutsPlugin</heading3>
    <paragraph>
      Converts some popular markdown shortcuts to a custom node
    </paragraph>

    <heading3>TableOfContentsPlugin</heading3>
    <paragraph>Shows a quick map of headings inside the document</paragraph>
  </fragment>
);
