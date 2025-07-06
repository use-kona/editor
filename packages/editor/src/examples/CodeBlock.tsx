import { forwardRef, type ReactNode, useMemo } from 'react';
import { Node } from 'slate';
import type { CustomElement } from '../../types';
import styles from './CodeBlock.module.css';
import { CheckIcon } from './icons/check';
import { CopyIcon } from './icons/copy';
import { Button } from './ui/Button';
import { Dropdown } from './ui/Dropdown';
import { Menu as MenuBase, type MenuConfig } from './ui/Menu';

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

type Props = {
  value: string;
  onChange: (value: string) => void;
  params: {
    element: CustomElement;
    Content: () => ReactNode;
  };
};

export const CodeBlock = (props: Props) => {
  const {
    value: language,
    onChange,
    params: { element, Content },
  } = props;

  const handleCopyClick = () => {
    const text = Array.from(Node.texts(element))
      .map((nodeEntry) => nodeEntry[0].text)
      .join('\n');

    navigator.clipboard.writeText(text);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: we don't care about other deps
  const menuConfig: MenuConfig = useMemo(
    () => ({
      items: languages.map(({ label, value }) => ({
        render: () => (
          <>
            <MenuBase.Icon>
              {value === language && <CheckIcon size={16} />}
            </MenuBase.Icon>
            <MenuBase.Title>{label}</MenuBase.Title>
          </>
        ),
        onSelect: () => {
          onChange(value);
        },
      })),
    }),
    [language],
  );
  return (
    <div className={styles.root}>
      <div className={styles.menu}>
        <Dropdown
          config={menuConfig}
          Menu={forwardRef<HTMLDivElement, { className: string }>(
            (props, ref) => (
              <div
                {...props}
                ref={ref}
                className={[styles.customMenu, props.className].join(' ')}
              />
            ),
          )}
        >
          {({ ref, onClick }) => (
            <Button ref={ref} size="sm" onClick={onClick}>
              {languages.find((l) => l.value === language)?.label ||
                'Select language'}
            </Button>
          )}
        </Dropdown>
        <Button size="sm" type="button" onClick={handleCopyClick}>
          <CopyIcon size={16} />
        </Button>
      </div>
      <div className={styles.content}>
        <Content />
      </div>
    </div>
  );
};
