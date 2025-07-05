import styles from './index.module.css';
import { ExampleEditor } from '@use-kona/editor';

export const frontmatter = {
  pageType: 'custom',
};

export default () => {
  return (
    <div className={styles.root}>
      <ExampleEditor />
    </div>
  )
}
