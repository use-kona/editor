# Changelog
This fill will contain all the changes for `@use-kona/editor`
since version `0.1.11`.

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
