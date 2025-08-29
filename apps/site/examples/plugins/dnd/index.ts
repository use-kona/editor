import create from './create';
import DragBlock from './DragBlock';
import DragHandler from './DragHandler';

export const dndPlugin = {
  create,
  components: {
    DragBlock,
    DragHandler,
  },
};
