import { useStore } from '@nanostores/react';
import styles from './Backdrop.module.css';
import { $store } from './store';

type Props = {
  onClose: () => void;
};

export const Backdrop = (props: Props) => {
  const { isFloatingMenuOpen } = useStore($store);
  const { onClose } = props;

  return isFloatingMenuOpen ? (
    <div className={styles.root} onClick={onClose} />
  ) : null;
};
