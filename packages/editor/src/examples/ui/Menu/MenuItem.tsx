import clsx from 'clsx';
import { forwardRef } from 'react';
import styles from './styles.module.css';

type MenuItemProps = {
  children: React.ReactNode;
  selectable?: boolean;
  isSelected?: boolean;
  danger?: boolean;
} & React.HTMLAttributes<HTMLLIElement>;

export const MenuItem = forwardRef<HTMLLIElement, MenuItemProps>(
  (props, ref) => {
    const {
      children,
      selectable = true,
      isSelected,
      danger,
      className,
      ...rest
    } = props;

    return (
      <li
        ref={ref}
        className={clsx(
          styles.menuItemRoot,
          !selectable && styles.menuItemRootNonSelectable,
          className,
        )}
        {...rest}
      >
        <div
          className={clsx(
            styles.menuItemContent,
            isSelected && styles.menuItemContentSelected,
            danger && styles.menuItemContentDanger,
          )}
        >
          {children}
        </div>
      </li>
    );
  },
);
