import styles from './styles.module.css';

type Props = {
  id: string;
};

const Emoji = (props: Props) => {
  return <em-emoji class={styles.emoji} id={props.id} size="16px" />;
};

export default Emoji;
