/**
 * @jest-environment node
 */

import React from 'react';

import { createSearchClient } from '../../../../test/mock';
import { getInstantSearchServerState } from '../getInstantSearchServerState';
import { InstantSearch } from '../InstantSearch';

describe('getInstantSearchServerState', () => {
  test('returns initialResults', async () => {
    const searchClient = createSearchClient();

    function App() {
      return (
        <InstantSearch indexName="indexName" searchClient={searchClient}>
          Children
        </InstantSearch>
      );
    }

    const serverState = await getInstantSearchServerState(<App />, {
      initialUiState: {},
    });

    expect(serverState).toMatchInlineSnapshot(`
Object {
  "initialResults": Object {
    "indexName": SearchResults {
      "_rawResults": Array [
        Object {
          "exhaustiveFacetsCount": true,
          "exhaustiveNbHits": true,
          "hits": Array [],
          "hitsPerPage": 20,
          "nbHits": 0,
          "nbPages": 0,
          "page": 0,
          "params": "",
          "processingTimeMS": 0,
          "query": "",
        },
      ],
      "_state": SearchParameters {
        "disjunctiveFacets": Array [],
        "disjunctiveFacetsRefinements": Object {},
        "facets": Array [],
        "facetsExcludes": Object {},
        "facetsRefinements": Object {},
        "hierarchicalFacets": Array [],
        "hierarchicalFacetsRefinements": Object {},
        "index": "indexName",
        "numericRefinements": Object {},
        "tagRefinements": Array [],
      },
      "disjunctiveFacets": Array [],
      "exhaustiveFacetsCount": true,
      "exhaustiveNbHits": true,
      "facets": Array [],
      "hierarchicalFacets": Array [],
      "hits": Array [],
      "hitsPerPage": 20,
      "nbHits": 0,
      "nbPages": 0,
      "page": 0,
      "params": "",
      "processingTimeMS": 0,
      "query": "",
    },
  },
}
`);
  });
});
