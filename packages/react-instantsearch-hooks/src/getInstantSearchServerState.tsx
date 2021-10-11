import React, { createContext, useContext } from 'react';
import { renderToString } from 'react-dom/server';

import type { InstantSearchSsrApi } from './InstantSearchSsrProvider';
import type { InitialResults } from './useInstantSearch';
import type { AlgoliaSearchHelper, SearchResults } from 'algoliasearch-helper';
import type { InstantSearch, UiState, Widget } from 'instantsearch.js';
import type { IndexWidget } from 'instantsearch.js/es/widgets/index/index';
import type { ReactNode } from 'react';

type InstantSearchSsrClient = {
  helper?: AlgoliaSearchHelper;
  search?: InstantSearch;
};

export type InstantSearchServerApi = {
  initialUiState: UiState;
  notifyServer(params: Required<InstantSearchSsrClient>): void;
};

export const InstantSearchServerContext =
  createContext<InstantSearchServerApi | null>(null);

export function useInstantSearchServerContext() {
  return useContext(InstantSearchServerContext);
}

type InstantSearchServerStateProps = {
  initialUiState: UiState;
};

export async function getInstantSearchServerState(
  children: ReactNode,
  { initialUiState }: InstantSearchServerStateProps
): Promise<InstantSearchSsrApi> {
  const client: InstantSearchSsrClient = {
    helper: undefined,
    search: undefined,
  };

  const notifyServer: InstantSearchServerApi['notifyServer'] = ({
    helper,
    search,
  }) => {
    client.helper = helper;
    client.search = search;
  };

  renderToString(
    <InstantSearchServerContext.Provider
      value={{
        initialUiState,
        notifyServer,
      }}
    >
      {children}
    </InstantSearchServerContext.Provider>
  );

  function waitForClientNotification() {
    return new Promise<Required<InstantSearchSsrClient>>((resolve, reject) => {
      let timerId: ReturnType<typeof setInterval> | undefined = undefined;

      const noResponseTimer = setTimeout(() => {
        clearTimeout(noResponseTimer);
        reject(
          new Error(
            'Unable to receive client notification from <InstantSearch /> in `getInstantSearchServerState`.'
          )
        );
      }, 3000);

      function checkClientNotification() {
        if (timerId) {
          clearInterval(timerId);
        }

        if (client.helper && client.search) {
          clearTimeout(noResponseTimer);
          resolve({ helper: client.helper, search: client.search });
        }
      }

      timerId = setInterval(checkClientNotification, 50);
    });
  }

  const { helper, search } = await waitForClientNotification();
  const initialResults: InitialResults = await searchOnlyWithDerivedHelpers(
    helper
  ).then(() => {
    const results = resolveIndex<SearchResults>(
      search.mainIndex,
      (indexWidget) => {
        return {
          [indexWidget.getIndexId()]: indexWidget.getResults()!,
        };
      }
    );

    return results;
  });

  return {
    initialResults,
  };
}

export function isIndexWidget(
  widget: Widget | IndexWidget
): widget is IndexWidget {
  return widget.$$type === 'ais.index';
}

function resolveIndex<TValue>(
  indexWidget: IndexWidget,
  callback: (widget: IndexWidget) => Record<string, TValue>
) {
  return indexWidget.getWidgets().reduce((acc, widget) => {
    if (!isIndexWidget(widget)) {
      return acc;
    }

    return {
      ...acc,
      ...resolveIndex(widget, callback),
    };
  }, callback(indexWidget));
}

function searchOnlyWithDerivedHelpers(helper: AlgoliaSearchHelper) {
  return new Promise<void>((resolve, reject) => {
    helper.searchOnlyWithDerivedHelpers();

    // We assume all derived helpers resolve at least in the same tick
    helper.derivedHelpers[0].on('result', () => {
      resolve();
    });

    helper.derivedHelpers.forEach((derivedHelper) =>
      derivedHelper.on('error', (error) => {
        reject(error);
      })
    );
  });
}
