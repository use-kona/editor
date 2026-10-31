import clsx from 'clsx';
import styles from './styles.module.css';

type MenuTitleProps = {
  children: React.ReactNode;
  className?: string;
};

export const MenuTitle = (props: MenuTitleProps) => {
  const { children, className, ...rest } = props;

  return (
    <span className={clsx(styles.menuTitle, className)} {...rest}>
      {children}
    </span>
  );
};
