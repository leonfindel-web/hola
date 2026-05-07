/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** Base URL of the SEARCH worker, e.g. https://search.leonfindel.workers.dev */
  readonly PUBLIC_SEARCH_API: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
