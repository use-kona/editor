import styles from './EmojiSelector.module.css';

type Props = {
  id: string;
};

export const Emoji = (props: Props) => {
  return <em-emoji class={styles.emoji} id={props.id} size="16px" />;
};
