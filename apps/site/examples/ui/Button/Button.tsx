import { forwardRef, type ReactNode } from 'react';
import { ButtonWrapper } from './ButtonWrapper';

type ButtonProps = {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'danger' | 'transparent';
  children: ReactNode;
  disabled?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const {
      size = 'md',
      variant = 'secondary',
      onClick = () => {},
      children,
      ...rest
    } = props;

    return (
      <ButtonWrapper
        ref={ref}
        size={size}
        onClick={onClick}
        variant={variant}
        {...rest}
      >
        {children}
      </ButtonWrapper>
    );
  },
);
