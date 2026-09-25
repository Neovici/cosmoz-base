# @neovici/cosmoz-base

Headless behaviour hooks for cosmoz web components, modelled on
[Base UI](https://base-ui.com). No elements, no styles: the `@neovici/cosmoz-*`
component packages use these hooks for keyboard, focus and ARIA behaviour.

The plan behind this package is in cosmoz-frontend:
[`docs/base-ui-port.md`](https://github.com/Neovici/cosmoz-frontend/blob/main/docs/base-ui-port.md).

## Install

```sh
npm install @neovici/cosmoz-base
```

`@pionjs/pion` is a peer dependency. Hooks must share the pion instance of the
component that calls them.

## Development

```sh
npm test      # Vitest in Chromium; CI also runs Firefox and WebKit
npm run lint
```

Releases use [changesets](https://github.com/changesets/changesets): add one with
`npx changeset` in your PR. Merging the generated "[ci] release" PR publishes to
npm.

## License

Apache-2.0. Behaviour and test cases are ported from Base UI (MIT).
