import { IPlugin, UiParams } from '../../types';
import styles from './styles.module.css';
import { Options } from './types';
import { Menu } from './Menu';

export class MenuPlugin implements IPlugin {
  constructor(private options: Options) {}

  ui = (params: UiParams) => {
    const { readOnly, children } = params;

    return readOnly ? (
      children
    ) : (
      <div className={styles.menu}>
        <Menu renderMenu={this.options.renderMenu} />
      </div>
    );
  };
}
