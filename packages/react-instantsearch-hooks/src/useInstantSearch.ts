import algoliasearchHelper from 'algoliasearch-helper';
import instantsearch from 'instantsearch.js';
import { useEffect, useMemo, version as ReactVersion } from 'react';

import { useForceUpdate } from '../useForceUpdate';

import { useInstantSearchServerContext } from './getInstantSearchServerState';
import { useInstantSearchSsrContext } from './InstantSearchSsrProvider';
import { useStableValue } from './useStableValue';
import version from './version';

import type { InstantSearchServerApi } from './getInstantSearchServerState';
import type { InstantSearchSsrApi } from './InstantSearchSsrProvider';
import type { SearchResults } from 'algoliasearch-helper';
import type {
  InstantSearchOptions,
  InstantSearch,
  Widget,
} from 'instantsearch.js';
import type { IndexWidget } from 'instantsearch.js/es/widgets/index/index';

export type InitialResults = Record<string, SearchResults>;

export type UseInstantSearchProps = InstantSearchOptions;

export function useInstantSearch(props: UseInstantSearchProps) {
  const serverContext = useInstantSearchServerContext();
  const ssrContext = useInstantSearchSsrContext();
  const stableProps = useStableValue(props);
  const search = useMemo(() => {
    const searchProps = serverContext
      ? {
          initialUiState: serverContext.initialUiState,
          ...stableProps,
        }
      : stableProps;

    return ssrAdapter(
      instantsearch(searchProps),
      stableProps,
      serverContext,
      ssrContext
    );
  }, [stableProps, serverContext, ssrContext]);
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    if (typeof stableProps.searchClient.addAlgoliaAgent === 'function') {
      stableProps.searchClient.addAlgoliaAgent(`react (${ReactVersion})`);
      stableProps.searchClient.addAlgoliaAgent(
        `react-instantsearch (${version})`
      );
      stableProps.searchClient.addAlgoliaAgent(
        `react-instantsearch-hooks (${version})`
      );
    }
  }, [stableProps.searchClient]);

  useEffect(() => {
    search.start();
    forceUpdate();

    return () => {
      search.dispose();
      forceUpdate();
    };
  }, [search, forceUpdate]);

  return search;
}

type SsrAdapterState = {
  isInitialRender: boolean;
  originalGetResults: undefined | (() => SearchResults | null);
};

function ssrAdapter(
  search: InstantSearch,
  props: UseInstantSearchProps,
  serverContext: InstantSearchServerApi | null,
  ssrContext: InstantSearchSsrApi | null
): InstantSearch {
  if (ssrContext) {
    const initialResults = ssrContext.initialResults;

    // InstantSearch.js patch to return the initial results on first load
    if (initialResults) {
      walkIndex(search.mainIndex, (indexWidget) => {
        const ssrAdapterState: SsrAdapterState = {
          isInitialRender: true,
          originalGetResults: undefined,
        };

        if (!ssrAdapterState.originalGetResults) {
          ssrAdapterState.originalGetResults = indexWidget.getResults;
        }

        indexWidget.getResults = () => {
          if (ssrAdapterState.isInitialRender) {
            ssrAdapterState.isInitialRender = false;

            return initialResults[indexWidget.getIndexId()] || null;
          }

          return ssrAdapterState.originalGetResults!();
        };
      });
    }
  }

  if (serverContext) {
    const helper = algoliasearchHelper(props.searchClient, props.indexName);

    search.helper = helper;
    search.mainHelper = helper;

    search.mainIndex.init({
      instantSearchInstance: search,
      parent: null,
      uiState: search._initialUiState,
    });
    search.started = true;

    serverContext.notifyServer({ helper, search });
  }

  return search;
}

export function isIndexWidget(
  widget: Widget | IndexWidget
): widget is IndexWidget {
  return widget.$$type === 'ais.index';
}

function walkIndex(
  indexWidget: IndexWidget,
  callback: (widget: IndexWidget) => void
) {
  callback(indexWidget);

  return indexWidget.getWidgets().forEach((widget) => {
    if (!isIndexWidget(widget)) {
      return;
    }

    walkIndex(widget, callback);
  });
}
