import clsx from 'clsx';
import {
  forwardRef,
  type JSX,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronRightIcon } from '../../icons';
import { useMenuPosition } from '../useMenuPosition';
import { useMergeRefs } from '../useMergeRefs';
import { MenuDelimiter } from './MenuDelimiter';
import { MenuHotkey } from './MenuHotkey';
import { MenuIcon } from './MenuIcon';
import { MenuItem } from './MenuItem';
import { MenuTitle } from './MenuTitle';
import { SafeSpace } from './SafeSpace';
import styles from './styles.module.css';
import type { MenuConfig } from './types';

type Coords = [number, number];

type MenuProps = {
  config: MenuConfig;
  className?: string;
  isOpen?: boolean;
  coords: Coords;
  target?: HTMLElement;
  onToggle?: (isOpen?: boolean) => void;
  Menu?: JSX.ElementType;
  MenuBody?: JSX.ElementType;
};

/**
 * Component for rendering various types of menus.
 */
export const MenuComponent = forwardRef<HTMLMenuElement, MenuProps>(
  (props, menuRef) => {
    const {
      isOpen,
      className,
      coords,
      config,
      Menu: MenuRootComponent,
      MenuBody,
      onToggle,
      target = document.body,
    } = props;
    const ref = useRef<HTMLMenuElement>(null);

    const mergedRef = useMergeRefs([menuRef, ref]);

    const refs = useRef<Record<string, HTMLLIElement>>({});

    const [rects, setRects] = useState<Record<string, DOMRect>>({});
    const [prevSelected, setPrevSelected] = useState<Array<number>>([]);
    const [selected, setSelected] = useState<Array<number>>([]);

    const isSelected = (index: number, level: number) => {
      return selected[level] === index;
    };

    const getConfig = (path: number[], level: number) => {
      return path
        .slice(0, level + 1)
        .reduce<MenuConfig | null>((prev, current) => {
          return (prev || config).items?.[current]?.config || null;
        }, null);
    };

    const getCurrentConfig = (path: number[]) => {
      if (path.length === 1) {
        return config;
      }

      return path.reduce<MenuConfig | null>((prev = config, current) => {
        const currentConfig = prev || config;
        return currentConfig.items?.[current]?.config || prev;
      }, null);
    };

    const updateRect = (path: number[]) => {
      const rect = refs.current[path.join(',')]?.getBoundingClientRect();
      setRects({
        ...rects,
        [path.join(',')]: rect,
      });
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: we care only about is open
    useLayoutEffect(() => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setRects({ '@': rect });
      }
    }, [isOpen]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: we care only about is open
    useEffect(() => {
      if (isOpen) {
        const firstSelectable = config.items?.findIndex(
          (item) => item.selectable ?? true,
        );
        if (firstSelectable !== undefined) {
          setSelected([firstSelectable]);
        }
      }
    }, [isOpen]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: we don't care about other props
    useEffect(() => {
      if (!isOpen) {
        return;
      }

      let timeout: ReturnType<typeof setTimeout>;

      selected.forEach((_, level) => {
        const config = level === 0 ? props.config : getConfig(selected, level);

        if (config?.onOpen && prevSelected[level] !== selected[level]) {
          timeout = setTimeout(() => {
            config.onOpen?.();
          });
        }
      });

      setPrevSelected(selected);

      return () => {
        clearTimeout(timeout);
      };
    }, [selected, isOpen]);

    const currentConfig = getCurrentConfig(selected);

    // biome-ignore lint/correctness/useExhaustiveDependencies: we care only about these props
    useEffect(() => {
      if (isOpen) {
        const handleKeyDown = (event: KeyboardEvent) => {
          switch (event.key) {
            case 'ArrowDown': {
              const firstSelectableIndex =
                currentConfig?.items?.findIndex(
                  (item) => item.selectable ?? true,
                ) ?? -1;
              const nextSelectableIndex = currentConfig?.items?.findIndex(
                (item, index) => {
                  return (
                    (item.selectable ?? true) &&
                    index > selected[selected.length - 1]
                  );
                },
              );

              if (nextSelectableIndex) {
                setSelected((selected) => {
                  const newSelected = [
                    ...selected.slice(0, selected.length - 1),
                    nextSelectableIndex === -1
                      ? firstSelectableIndex
                      : nextSelectableIndex,
                  ];
                  updateRect(newSelected);
                  refs.current[newSelected.join(',')]?.scrollIntoView({
                    block: 'nearest',
                  });

                  return newSelected;
                });
              }
              event.preventDefault();
              event.stopPropagation();
              break;
            }
            case 'ArrowUp': {
              if (!currentConfig?.items?.length) {
                return;
              }

              const lastSelectableIndex = currentConfig?.items?.reduce(
                (acc, item, index) => {
                  return (item.selectable ?? true) ? index : acc;
                },
                -1,
              );

              const prevSelectableIndex = currentConfig?.items
                ?.slice(0, selected[selected.length - 1])
                .reverse()
                .findIndex((item) => item.selectable ?? true);

              const newSelected = [
                ...selected.slice(0, selected.length - 1),
                prevSelectableIndex === -1
                  ? lastSelectableIndex
                  : selected[selected.length - 1] - prevSelectableIndex - 1,
              ];

              setSelected(() => {
                updateRect(newSelected);
                refs.current[newSelected.join(',')].scrollIntoView({
                  block: 'nearest',
                });

                return newSelected;
              });

              event.preventDefault();
              event.stopPropagation();
              break;
            }
            case 'ArrowRight': {
              const currentItem =
                currentConfig?.items?.[selected[selected.length - 1]];

              if (currentItem?.config?.items) {
                const firstSelectableIndex = currentConfig?.items?.findIndex(
                  (item) => item.selectable ?? true,
                );
                if (firstSelectableIndex !== undefined) {
                  setSelected((selected) => {
                    const newSelected = [...selected, firstSelectableIndex];
                    updateRect(newSelected);

                    return newSelected;
                  });
                }
                currentItem.config?.onFocus?.();
              }
              event.preventDefault();
              event.stopPropagation();
              break;
            }
            case 'ArrowLeft': {
              setSelected((selected) => {
                return selected.slice(0, selected.length - 1);
              });
              event.preventDefault();
              event.stopPropagation();
              break;
            }
            case 'Escape': {
              onToggle?.(false);
              event.preventDefault();
              event.stopPropagation();
              break;
            }
            case 'Enter': {
              const currentItem =
                currentConfig?.items?.[selected[selected.length - 1]];
              if (currentItem?.onSelect) {
                currentItem.onSelect();
              }
              onToggle?.(false);
              event.preventDefault();
              event.stopPropagation();
              break;
            }
            case ' ': {
              const currentItem =
                currentConfig?.items?.[selected[selected.length - 1]];
              if (currentItem?.onSelect) {
                currentItem.onSelect();
              }
              event.preventDefault();
              event.stopPropagation();
              break;
            }
          }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
          document.removeEventListener('keydown', handleKeyDown);
        };
      }
    }, [isOpen, currentConfig, selected]);

    const renderSubMenu = (): ReactNode => {
      return selected.map((_, selectedIndex) => {
        const config = getConfig(selected, selectedIndex);
        const items = config?.items;

        const path = selected.slice(0, selectedIndex + 1).join(',');
        const rect = rects[path];

        if (!rect || !items) {
          return null;
        }

        const coords = [rect.left + rect.width, rect.top] as Coords;

        return createPortal(
          <InnerMenu
            key={path}
            rect={rect}
            coords={coords}
            Menu={MenuRootComponent}
            MenuBody={MenuBody}
          >
            {config?.header?.()}
            <Scrollable>
              {items.map((item, index) => (
                <MenuItem
                  key={index}
                  ref={(element) => {
                    if (element && (item.selectable ?? true)) {
                      const selectedPath = [
                        ...selected.slice(0, selectedIndex + 1),
                        index,
                      ];
                      refs.current[selectedPath.join(',')] = element;
                    }
                  }}
                  selectable={item.selectable}
                  isSelected={isSelected(index, selectedIndex + 1)}
                  onMouseEnter={(event) => {
                    if (item.selectable ?? true) {
                      const selectedPath = [
                        ...selected.slice(0, selectedIndex + 1),
                        index,
                      ];
                      const rect = event.currentTarget.getBoundingClientRect();

                      setSelected(selectedPath);
                      setRects((rects) => ({
                        ...rects,
                        [selectedPath.join(',')]: rect,
                      }));
                    }
                  }}
                  onClick={() => {
                    const autoClose = item.autoClose ?? true;
                    autoClose && onToggle?.(false);
                    item.onSelect?.();
                  }}
                >
                  {item.render()}
                  {item.config?.items && <ChevronRightIcon size={16} />}
                </MenuItem>
              ))}
            </Scrollable>
            {config?.footer?.()}
          </InnerMenu>,
          target,
        );
      });
    };

    if (!isOpen) {
      return null;
    }

    return (
      <>
        {createPortal(
          <>
            <InnerMenu
              className={className}
              ref={mergedRef}
              coords={coords}
              rect={rects['@']}
              Menu={MenuRootComponent}
              MenuBody={MenuBody}
              root
            >
              {config?.header?.()}
              <Scrollable>
                {config.items?.map((item, index) => (
                  <MenuItem
                    key={index}
                    ref={(element) => {
                      if (element && (item.selectable ?? true)) {
                        refs.current[index] = element;
                      }
                    }}
                    selectable={item.selectable}
                    isSelected={isSelected(index, 0)}
                    onMouseEnter={(event) => {
                      if (item.selectable ?? true) {
                        const rect =
                          event.currentTarget.getBoundingClientRect();

                        setSelected([index]);
                        setRects((rects) => ({
                          ...rects,
                          [index]: rect,
                        }));
                      }
                    }}
                    onClick={() => {
                      const autoClose = item.autoClose ?? true;
                      autoClose && onToggle?.(false);
                      item.onSelect?.();
                    }}
                  >
                    {item.render()}
                    {item.config?.items && <ChevronRightIcon size={16} />}
                  </MenuItem>
                ))}
              </Scrollable>
              {config?.footer?.()}
            </InnerMenu>
            <Backdrop onClick={() => onToggle?.(false)} />
          </>,
          target,
        )}
        {renderSubMenu()}
      </>
    );
  },
);

type InnerMenuProps = {
  rect: DOMRect;
  children: React.ReactNode;
  className?: string;
  coords: Coords;
  root?: boolean;
  Menu?: JSX.ElementType;
  MenuBody?: JSX.ElementType;
};

const InnerMenu = forwardRef<HTMLMenuElement, InnerMenuProps>((props, ref) => {
  const {
    root,
    className,
    coords,
    rect,
    children,
    Menu: MenuRootComponent = Root,
    MenuBody: MenuBodyComponent = MenuBody,
  } = props;

  const [itemRect, setItemRect] = useState<DOMRect>();
  const itemRef = useRef<HTMLDivElement>(null);

  const [transform, newCoords] = useMenuPosition(
    {
      x: coords[0],
      y: coords[1],
    },
    (context) => {
      const [horizontal, vertical] = context.helpers.isWithinWindow();

      if (root) {
        return context.point;
      }

      if (!rect) {
        return context.point;
      }

      if (!horizontal) {
        context.flip([true, false]).move(-rect?.width, 0).move(-4, 0);
      }

      if (!vertical) {
        context.flip([false, true]).move(0, rect?.height).move(0, -4);
      }

      return context.point;
    },
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: we care only about these props
  useLayoutEffect(() => {
    if (itemRef.current && !root) {
      transform(itemRef.current);
    }
  }, [coords[0], coords[1], root]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we care only about these props
  useEffect(() => {
    if (itemRef.current) {
      setItemRect(itemRef.current.getBoundingClientRect());
    }
  }, [newCoords]);

  const menuCoords = root ? coords : [newCoords.x, newCoords.y];

  return (
    <>
      {!root && <SafeSpace rect={itemRect} />}
      <MenuRootComponent
        className={className}
        ref={ref}
        coords={menuCoords}
        style={{ left: menuCoords[0], top: menuCoords[1] }}
      >
        <MenuBodyComponent ref={itemRef}>{children}</MenuBodyComponent>
      </MenuRootComponent>
    </>
  );
});

export const Menu = MenuComponent as typeof MenuComponent & {
  Root: typeof Root;
  Body: typeof MenuBody;
  Item: typeof MenuItem;
  Icon: typeof MenuIcon;
  Title: typeof MenuTitle;
  Hotkey: typeof MenuHotkey;
  Delimiter: typeof MenuDelimiter;
};

interface RootProps extends React.MenuHTMLAttributes<HTMLMenuElement> {
  coords: Coords;
  className?: string;
}

const Root = forwardRef<HTMLMenuElement, RootProps>((props, ref) => {
  const { coords, className, children, ...rest } = props;

  return (
    <menu
      ref={ref}
      className={clsx(styles.menu, styles.menuEnterAnimation, className)}
      style={{ left: coords[0], top: coords[1] }}
      {...rest}
    >
      {children}
    </menu>
  );
});

interface MenuBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const MenuBody = forwardRef<HTMLDivElement, MenuBodyProps>((props, ref) => {
  const { className, children, ...rest } = props;

  return (
    <div ref={ref} className={clsx(styles.menuBody, className)} {...rest}>
      {children}
    </div>
  );
});

interface ScrollableProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Scrollable: React.FC<ScrollableProps> = (props) => {
  const { className, children, ...rest } = props;

  return (
    <div className={clsx(styles.menuScrollable, className)} {...rest}>
      {children}
    </div>
  );
};

interface BackdropProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Backdrop: React.FC<BackdropProps> = (props) => {
  const { className, ...rest } = props;

  return <div className={clsx(styles.menuBackdrop, className)} {...rest} />;
};

Menu.Root = Root;
Menu.Body = MenuBody;
Menu.Item = MenuItem;
Menu.Icon = MenuIcon;
Menu.Title = MenuTitle;
Menu.Hotkey = MenuHotkey;
Menu.Delimiter = MenuDelimiter;
