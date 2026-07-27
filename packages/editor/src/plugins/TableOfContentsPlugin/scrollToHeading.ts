type ScrollIntoViewOptionsWithContainer = ScrollIntoViewOptions & {
  container: 'all' | 'nearest';
};

export const scrollToHeading = (element: HTMLElement) => {
  const options: ScrollIntoViewOptionsWithContainer = {
    behavior: 'smooth',
    block: 'start',
    container: 'nearest',
  };

  element.scrollIntoView(options);
};
