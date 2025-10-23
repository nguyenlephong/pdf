import createCache from '@emotion/cache';

const muiCache = createCache({
  key: 'mui',
  prepend: true, // ensures MUI styles are inserted before antd/other styles
});

export default muiCache;