# Changelog
This fill will contain all the changes for `@use-kona/editor`
since version `0.1.11`.

## 0.2.0
### DnDPlugin
**Changed (breaking)**
* Block selection and movement now use element identity and live Slate path references instead of node IDs. `EditorInnerDragItem.nodes` now contains `DragNode[]`, whose `nodeId` is optional; custom drag consumers must handle nodes without IDs. Inner drag sources now include optional `pathRefs`.
* Moving between separate editor views of the same nonempty `documentId` still requires unique, matching node IDs. Moves are ignored when the source blocks cannot be mapped unambiguously in the destination.

**Added**
* Added animated block reordering after a drop, including surrounding blocks and nested lists, with support for reduced-motion preferences.

**Fixed**
* Multi-block selections, nested list items, and collapsible sections can now move without `NodeIdPlugin`, including documents with missing or duplicate IDs.
* Dragging now follows source blocks through insertions, edits, and deletions made during the drag, and transfers their current content instead of a stale snapshot.
* Alt-drag copies and moves between documents now work without passing `nodeIdPlugin` to DnD. Inserted copies receive fresh IDs from the configured generator, or have source IDs removed so the destination can assign them.
* Nested drop targets now handle each drop once, and live drag references are released after drops and cancelled drags.

### Core
**Added**
* Added the `isSelectable` block option, while preserving plugin editor overrides when the option is omitted.

**Changed**
* Block selection highlights now use a separate animated layer that covers the spaces between adjacent selected blocks, keeps separate groups apart, and follows scrolling, resizing, and document changes without affecting content layout. Reduced-motion preferences disable the transitions.
* Block wrappers now expose `data-editor-block` and `data-editor-selected` attributes for selection tracking.
* Corrected the `EditorContext.selectedNodes` and provider types to `WritableAtom<CustomElement[]>`.

**Fixed**
* Backspace and Delete now remove all selected blocks as one undoable action, avoid deleting a selected child twice when its parent is selected, and leave an editable paragraph when the document becomes empty.
* Selected-block deletion now respects asynchronous `onBeforeDelete` vetoes and `onDelete` callbacks, tracks paths while hooks are pending, ignores repeated deletion presses, and preserves read-only content.

### CodeBlockPlugin
**Added**
* Added inline code formatting through the `code` text mark, single-backtick typing shortcuts, and HTML `<code>` import and export. The shortcut preserves surrounding formatting and continues typing outside inline code.
* Added the `--kona-editor-inline-code-background` CSS custom property to customize inline code backgrounds.

**Changed**
* Tab now inserts two spaces inside code blocks instead of four.

**Fixed**
* Changing a code block's language now works after editing its text or moving its path, including language menus that retain their original callback.

### EmojiPlugin
**Changed**
* Emojis are now nonselectable inline voids, allowing the caret to move across them without stopping inside their hidden text children.

**Fixed**
* Emoji rendering now preserves Slate's required children and keeps the visible emoji noneditable.
* Suggestions now read the query before the caret, allowing emoji insertion before existing text when separated by whitespace and across formatted text leaves, while suppressing suggestions immediately before an existing word or for expanded selections.

### HighlightsPlugin
**Changed**
* Text highlights now have rounded, padded edges that remain visible across wrapped lines, with spacing between adjacent highlighted spans.

**Fixed**
* Enter at the end of a highlight now starts unhighlighted content while preserving other formatting; splitting inside a highlight retains its color.
* Arrow Right at a highlight boundary now exits highlight formatting before normal caret navigation resumes.

### ListsPlugin
**Added**
* Added the optional `start` property for numbered lists, including rendering and HTML import and export.

**Fixed**
* Adjacent numbered lists now preserve explicit numbering restarts and only merge an explicitly numbered list when its start continues the preceding list.

### PlaceholderPlugin
**Fixed**
* A selection spanning multiple blocks now shows at most one placeholder, on the first text leaf of the first selected block when it is empty, including nested blocks. The placeholder follows selection changes without appearing on nonempty text.

### TableOfContentsPlugin
**Added**
* Added an optional `renderEmoji` callback for displaying standard and custom emojis in table-of-contents entries.

**Fixed**
* Heading labels now include all text leaves and nested inline content in order instead of only the first text child, including headings containing only an emoji when a renderer is configured.

### Development and examples
**Changed**
* Removed the standalone Rspress documentation app and moved its reusable editor examples into `packages/editor/stories/examples`, with Storybook run and build instructions in the editor README.
* Updated Storybook to `10.6.5`, Rsbuild to `2.3.x`, Rslib to `1.0.5`, the React Rsbuild plugin to `2.1.1`, the Storybook Rsbuild/Rslib integrations to `3.6.1`, and Vitest to `5.0.5`; removed obsolete Storybook addons.
* Consolidated dependencies into the root `pnpm-lock.yaml` and configured workspace build-script approvals for `@parcel/watcher`, `core-js`, and `esbuild`.
* Updated demo heading sizes, spacing, code-block styling, and editor scrolling. Demo drag handles now toggle block selection with a plain click, including code blocks.
* Replaced the demo emoji selector with Emoji Mart search, emoji previews, custom Kona emoji support, and keyboard navigation.
* Updated the demo numbered-list shortcut to preserve the typed starting number, and added stories for text highlights, emoji headings, and block selection.

**Fixed**
* Storybook now serves its mocker runtime during incremental rebuilds and runs on port `6006` without enabling the Node inspector.

## 0.1.35
### Core
**Changed**
* Selected blocks now use rounded borders and a background highlight, with adjacent selected blocks forming a continuous group.
* Nested block selections now highlight their top-level container, and selected content no longer shrinks.
* Added the `--kona-editor-border-selected-color` CSS custom property to customize selection borders.

### Dependencies
**Changed**
* Upgraded Slate to `0.146.0`, Slate React and Slate DOM to `0.147.3`, Slate History to `0.144.0`, and Slate Hyperscript to `0.138.3`.
* Updated the editor's Slate peer requirements and aligned the documentation site's dependencies.

## 0.1.34
### DnDPlugin
**Fixed**
* Dropping a block above or below another block now preserves the intended position when moving in either direction.
* Multi-block selections and collapsible sections now retain their document order when moved, including selections spanning the drop target.
* Corrected drop positions within nested lists and preserved moves between list levels.

## 0.1.33
### CollapsibleBlocksPlugin
**Fixed**
* Pressing Enter at the end of a collapsed section heading now expands the section so the new paragraph remains visible.

## 0.1.32
### Core
**Fixed**
* Backspace after an inline void, such as a link chip, now removes the chip without deleting its containing paragraph.
* Void-block Backspace navigation now requires a collapsed caret at the actual start of a block and only considers preceding block elements.

## 0.1.31
### CollapsibleBlocksPlugin
**Fixed**
* Kept chevrons positioned within custom block wrappers.

### DnDPlugin
**Fixed**
* Hidden section content now hides its drag controls without consumer CSS.

## 0.1.30
### CollapsibleBlocksPlugin
**Added**
* Added configurable collapsible sections with persisted block state and leading chevrons.

**Changed**
* Nested configured types now remain inside a parent section until the next equal-or-higher type.
* Collapsible sections now compose correctly with block wrappers regardless of plugin array order.
* Dragging a collapsible boundary moves its complete section, including nested content and persisted collapsed state.

### DnDPlugin
**Fixed**
* Fixed moving blocks without `nodeId` values, including paragraphs and list items.
* Fixed section moves when dropping at the end of a container or when hover state is unavailable at drop time.

### CodeBlockPlugin
**Fixed**
* Numbered code-block lines sequentially instead of displaying `1` on every line.

## 0.1.29
### CommandsPlugin
**Fixed**
* Prioritized slash-menu Arrow Up and Arrow Down navigation over editor void-block navigation.

## 0.1.28
### LinksPlugin
**Fixed**
* Rejected unsafe URL schemes when creating, typing, or importing links, and rendered persisted unsafe links as inline content.

## 0.1.27
### TableOfContentsPlugin
**Fixed**
* Limited heading navigation to the closest scrollable container so it no longer scrolls the surrounding page.

### Core
**Fixed**
* Prevented the default Escape behavior when clearing block selection and blurring the editor.

## 0.1.26
### ListsPlugin
**Added**
* Added `ignoreBackspaceTypes` so custom first-level list items can opt out of the built-in Backspace conversion to paragraphs.

**Fixed**
* Prevented the triggering Backspace event after the plugin converts a first-level list item into a paragraph.

## 0.1.25
### DnDPlugin
**Added**
* Added drag-and-drop between editor instances, with move and Alt-drag copy behavior.
* Added typed external drag sources and custom drop handlers for converting external items into editor blocks.
* Added multi-block selection and dragging, including selection through the drag handle.
* Added `documentId` and `nodeIdPlugin` options so drops can distinguish documents and generate fresh node IDs when copying blocks.

**Changed**
* Drag items now use the `EditorDragItem` shape and include the dragged nodes, source editor, and optional custom item data.
* The custom `renderBlock` API now exposes native drop and selection-toggle event handlers.

### Core
**Added**
* Added block selection state and the public `useEditorContext` hook.
* Added keyboard navigation and actions for void blocks using Escape, Arrow Up/Down, Backspace, and Enter.
* Added selected-block styling through the `--kona-editor-selected-color` CSS custom property.

### Dependencies
**Changed**
* Upgraded Slate, Slate React, and Slate DOM to `0.126.x`.

## 0.1.23
### DnDPlugin
**Fixed**
* Fixed top/bottom drop position logic during drag-and-drop. Nodes now correctly insert above or below the target based on drop location.

## 0.1.22
### DnDPlugin
**Fixed**
* Fixed moving multiple selected nodes at once during drag-and-drop.
* Fixed drop target ref handling when merging Slate element refs with DnD refs.
* Selection is now cleared after a successful drag-and-drop move.

### ListsPlugin
**Fixed**
* Fixed merging of adjacent lists during normalization.
* Empty lists are now removed during normalization.

## 0.1.21
### Core
**Added**
* Added imperative `EditorRef.insertNodes(nodes, at?)` API for inserting arbitrary Slate nodes.
* `insertNodes` uses native Slate insertion and supports explicit locations (including root and nested paths), selection insertion, and append-to-end fallback when selection is missing.
* `insertNodes` returns `false` for invalid input/location and `true` on successful insertion.

## 0.1.20
### Core
**Added**
* Added `onDragOver` to supported editor event handlers.

## 0.1.19
### CommandsPlugin
**Added**
* Added custom `render` prop for submenu command items.

### Core
**Fixed**
* Added `onDragOver` handler support in plugin event handlers.

## 0.1.18
### CommandsPlugin
**Improved**
* Scoped command search to the current submenu level.
* Simplified command menu UI.

## 0.1.17
### CommandsPlugin
**Fixed**
* Fixed nested command menu items with async `getCommands` support.

### DnDPlugin
**Added**
* Added selectable drag block styling with multi-node selection.

## 0.1.16
### DnDPlugin
**Added**
* Added a way to alter the dragged item data

## 0.1.15
### LinksPlugin
**Fixed**
* It was impossible to close the link popup on click outside

## 0.1.14 - 2025-08-17
### Core
**Fixed:**
* Removed the default normalizeNode handler to avoid problems with
the sync plugin in the future.

## 0.1.13 - 2025-08-17
### Core
**Added:**
* Added commands for the plugins

### NodeIdPlugin
**Fixed:**
* Existing id was ignored and overwritten

## 0.1.12 - 2025-08-17

### Editor Example
**Fixed:**
* Fixed the scrolling in the editor example

### TableOfContentsPlugin
**Fixed:**
* Fixed position of the header after scrolling to it

**Improved:**
* Zone of activation for the table of contents block
