/**
 * TypeScript declaration for CSS modules
 * Allows TypeScript to understand imports of CSS module files
 */

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const css: { [key: string]: string };
  export default css;
}
