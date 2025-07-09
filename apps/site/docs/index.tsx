import styles from './index.module.css';
import { ExampleEditor } from '../examples/Editor';

export const frontmatter = {
  pageType: 'custom',
};

export default () => {
  return (
    <div className={styles.root}>
      <pre>
        <code>
          npm install @use-kona/editor
        </code>
      </pre>
      <ExampleEditor />
    </div>
  )
}
