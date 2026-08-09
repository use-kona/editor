const allowedProtocols = new Set(['http:', 'https:', 'mailto:']);

export const isSafeLinkUrl = (value: string): boolean => {
  try {
    return allowedProtocols.has(new URL(value).protocol);
  } catch {
    return false;
  }
};
