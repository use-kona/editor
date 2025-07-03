import { Node } from 'slate';
import type { CustomElement } from '../../types';
import { CopyIcon } from './icons/copy';
import styles from './LanguageSelector.module.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  params: {
    element: CustomElement;
  };
};

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'bash', label: 'Bash' },
  { value: 'sql', label: 'SQL' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'yaml', label: 'YAML' },
  { value: 'plaintext', label: 'Plain Text' },
];

export const LanguageSelector = (props: Props) => {
  const { value: language, onChange, params } = props;

  const handleCopyClick = () => {
    const text = Array.from(Node.texts(params.element))
      .map((nodeEntry) => nodeEntry[0].text)
      .join('\n');

    navigator.clipboard.writeText(text);
  };

  return (
    <div className={styles.root}>
      <select
        tabIndex={-1}
        value={language}
        onChange={(event) => onChange(event.target.value)}
      >
        {languages.map((language) => (
          <option key={language.value} value={language.value}>
            {language.label}
          </option>
        ))}
      </select>
      {/*<select value={value} onChange={(event) => onChange(event.target.value)}></select>*/}
      <button className={styles.button} type="button" onClick={handleCopyClick}>
        <CopyIcon size={16} />
      </button>
    </div>
  );
};
