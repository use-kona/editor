import { forwardRef } from 'react';
import styles from './styles.module.css';

type ButtonWrapperProps = {
  size: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'transparent' | 'danger';
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const ButtonWrapper = forwardRef<HTMLButtonElement, ButtonWrapperProps>((props, ref) => {
  const { size, variant = 'secondary', className, ...rest } = props;

  const sizeClass = styles[`size${size.charAt(0).toUpperCase()}${size.slice(1)}`];
  const variantClass = styles[variant];

  return (
    <button
      ref={ref}
      className={`${styles.button} ${sizeClass} ${variantClass} ${className || ''}`}
      {...rest}
    />
  );
});
