import clsx from 'clsx';
import styles from './styles.module.css';

type MenuHotkeyProps = {
  children: React.ReactNode;
  className?: string;
};

export const MenuHotkey = (props: MenuHotkeyProps) => {
  const { children, className, ...rest } = props;

  return (
    <span className={clsx(styles.menuHotkey, className)} {...rest}>
      {children}
    </span>
  );
};
