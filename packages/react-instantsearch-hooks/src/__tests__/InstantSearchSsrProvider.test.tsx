import { render, act } from '@testing-library/react';
import { SearchParameters, SearchResults } from 'algoliasearch-helper';
import React from 'react';

import { createSearchClient } from '../../../../test/mock';
import { InstantSearch } from '../InstantSearch';
import { InstantSearchSsrProvider } from '../InstantSearchSsrProvider';
import { useHits } from '../useHits';

describe('InstantSearchSsrProvider', () => {
  test('provides initialResults to InstantSearch', () => {
    const searchClient = createSearchClient();
    const initialResults = {
      indexName: new SearchResults(new SearchParameters(), [
        {
          hits: [{ objectID: '1' }, { objectID: '2' }, { objectID: '3' }],
        },
      ]),
    };

    let container;

    act(() => {
      const result = render(
        <InstantSearchSsrProvider initialResults={initialResults}>
          <InstantSearch searchClient={searchClient} indexName="indexName">
            <Hits />
          </InstantSearch>
        </InstantSearchSsrProvider>
      );

      container = result.container;
    });

    expect(container).toMatchInlineSnapshot(`
<div>
  <ol>
    <li>
      1
    </li>
    <li>
      2
    </li>
    <li>
      3
    </li>
  </ol>
</div>
`);
  });
});

function Hits() {
  const { hits } = useHits();

  return (
    <ol>
      {hits.map((hit) => (
        <li key={hit.objectID}>{hit.objectID}</li>
      ))}
    </ol>
  );
}
