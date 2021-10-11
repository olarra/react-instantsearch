import React, { createContext, useContext } from 'react';

import type { InitialResults } from './useInstantSearch';
import type { ReactNode } from 'react';

export type InstantSearchSsrApi = {
  initialResults: InitialResults;
};

export const InstantSearchSsrContext =
  createContext<InstantSearchSsrApi | null>(null);

export function useInstantSearchSsrContext() {
  return useContext(InstantSearchSsrContext);
}

export type InstantSearchSsrProviderProps = InstantSearchSsrApi & {
  children?: ReactNode;
};

export function InstantSearchSsrProvider({
  children,
  ...props
}: InstantSearchSsrProviderProps) {
  return (
    <InstantSearchSsrContext.Provider value={props}>
      {children}
    </InstantSearchSsrContext.Provider>
  );
}
