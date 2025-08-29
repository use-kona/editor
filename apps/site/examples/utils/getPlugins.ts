import {
  basicFormattingPlugin,
  breaksPlugin,
  codeBlockPlugin,
  commandsPlugin,
  dndPlugin,
  emojiPlugin,
  floatingPlugin,
  headingsPlugin,
  highlightsPlugin,
  linksPlugin,
  listsPlugin,
  menuPlugin,
  nodeIdPlugin,
  placeholderPlugin,
  shortcutsPlugin,
  tableOfContentsPlugin,
} from '../plugins';

import { colors } from './colors';

export const getPlugins = () => {
  const listsPluginInstance = listsPlugin.create();
  const basicFormattingPluginInstance = basicFormattingPlugin.create();
  const breaksPluginInstance = breaksPlugin.create();
  const codeBlockPluginInstance = codeBlockPlugin.create();
  const commandsPluginInstance = commandsPlugin.create({
    listsPlugin: listsPluginInstance,
  });
  const dndPluginInstance = dndPlugin.create();
  const emojiPluginInstance = emojiPlugin.create();
  const floatingPluginInstance = floatingPlugin.create();
  const headingsPluginInstance = headingsPlugin.create();
  const highlightsPluginInstance = highlightsPlugin.create({
    colors,
  });
  const linksPluginInstance = linksPlugin.create({
    floatingMenuPlugin: floatingPluginInstance,
  });
  const menuPluginInstance = menuPlugin.create({
    listsPlugin: listsPluginInstance,
  });
  const nodeIdPluginInstance = nodeIdPlugin.create();
  const placeholderPluginInstance = placeholderPlugin.create();
  const shortcutsPluginInstance = shortcutsPlugin.create();
  const tableOfContentsPluginInstance = tableOfContentsPlugin.create();

  return [
    basicFormattingPluginInstance,
    emojiPluginInstance,
    placeholderPluginInstance,
    nodeIdPluginInstance,
    headingsPluginInstance,
    menuPluginInstance,
    dndPluginInstance,
    shortcutsPluginInstance,
    linksPluginInstance,
    commandsPluginInstance,
    tableOfContentsPluginInstance,
    floatingPluginInstance,
    highlightsPluginInstance,
    breaksPluginInstance,
    listsPluginInstance,
    codeBlockPluginInstance,
  ];
};
