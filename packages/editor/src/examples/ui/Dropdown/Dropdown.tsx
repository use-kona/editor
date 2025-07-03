import {
  type JSX,
  type RefObject,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Menu, type MenuConfig } from '../Menu';
import { useMenuPosition } from '../useMenuPosition';

type ChildrenProps = { ref: RefObject<any>; onClick: () => void };

type DropdownProps = {
  config: MenuConfig;
  children: (props: ChildrenProps) => React.ReactNode;
  target?: HTMLElement;
  Menu?: JSX.ElementType;
  MenuBody?: JSX.ElementType;
  onClose?: () => void;
};

export const Dropdown = (props: DropdownProps) => {
  const {
    config,
    target,
    children,
    onClose = () => {},
    Menu: MenuComponent,
    MenuBody,
  } = props;
  const [rect, setRect] = useState<DOMRect>();
  const [isOpen, setOpen] = useState(false);

  const ref = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLMenuElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we care only about isOpen
  useLayoutEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setRect(rect);
    }
  }, [isOpen]);

  const coords = {
    x: rect?.left ?? 0,
    y: (rect?.top ?? 0) + (rect?.height ?? 0),
  };

  const [transform, newCoords] = useMenuPosition(coords, (context) => {
    const [horizontal, vertical] = context.helpers.isWithinWindow();

    if (!vertical) {
      context.flip([false, true]).move(0, -(rect?.height ?? 0));
    }

    if (!horizontal) {
      context.flip([true, false]).move(rect?.width ?? 0, 0);
    }

    return context.point;
  });

  const changeOpen = (value: boolean) => {
    setOpen(value);
    if (!value) {
      onClose();
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: we don't care about all the deps
  useLayoutEffect(() => {
    if (menuRef.current) {
      transform(menuRef.current);
    }
  }, [isOpen, rect?.left, rect?.top, config]);

  const handleClick = () => {
    changeOpen(!isOpen);
  };

  const handleToggle = (value?: boolean) => {
    changeOpen(value === undefined ? !isOpen : value);
  };

  return (
    <>
      {children({ ref, onClick: handleClick })}
      <Menu
        target={target}
        ref={menuRef}
        Menu={MenuComponent}
        MenuBody={MenuBody}
        coords={[newCoords.x, newCoords.y]}
        isOpen={isOpen}
        config={config}
        onToggle={handleToggle}
      />
    </>
  );
};
