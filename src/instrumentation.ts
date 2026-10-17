/**
 * Server bootstrap, run by Next.js before any request is handled.
 *
 * Node 22+ ships an experimental Web Storage API. On Node 25 the `localStorage`
 * global is present but, unless `--localstorage-file` points somewhere valid,
 * its methods are undefined. Libraries that detect a browser with
 * `typeof localStorage !== 'undefined'` therefore take the browser path during
 * SSR and blow up on `localStorage.getItem is not a function`.
 *
 * Removing the broken global on the server restores the correct answer to that
 * feature check. It affects the server runtime only: real browsers are
 * untouched.
 */
export async function register() {
  if (typeof globalThis.localStorage === 'undefined') return;

  const usable =
    typeof (globalThis.localStorage as Storage)?.getItem === 'function';

  if (!usable) {
    // @ts-expect-error - deliberately removing a malformed platform global
    delete globalThis.localStorage;
    // @ts-expect-error - sessionStorage is broken in the same way
    delete globalThis.sessionStorage;
  }
}
