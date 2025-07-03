import clsx from 'clsx';
import styles from './styles.module.css';

type MenuIconProps = {
  children?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>;

export const MenuIcon = (props: MenuIconProps) => {
  const { children, className, ...rest } = props;

  return (
    <span className={clsx(styles.menuIcon, className)} {...rest}>
      {children}
    </span>
  );
};
