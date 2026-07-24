# Changelog
This fill will contain all the changes for `@use-kona/editor`
since version `0.1.11`.

## 0.1.27
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
