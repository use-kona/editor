import { getMockerRuntime } from 'storybook/internal/mocking-utils';

export default (router) => {
  // Rsbuild can drop this required script during incremental rebuilds.
  router.use('/mocker-runtime-injected.js', (_req, res) => {
    res.setHeader('Content-Type', 'text/javascript');
    res.end(getMockerRuntime());
  });
};
