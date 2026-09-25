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

## Hooks

### `useListNavigation`

Keeps a highlighted index for a list and moves it with ArrowUp/ArrowDown
(wrapping by default), Home/End and PageUp/PageDown, skipping disabled items.
It works on indexes, so virtualized lists are fine. Keys pressed with a
modifier are left to the caller.

```ts
const { activeIndex, setActiveIndex, onKeyDown } = useListNavigation({
	count: items.length,
	defaultIndex: query ? 0 : -1,
	pageSize: 5,
	homeEnd: false, // Home/End move the caret in an editable input
	isDisabled: (i) => items[i].disabled,
});
```

When `count` or `defaultIndex` changes, the highlight is clamped to the list,
or reset to `defaultIndex` if nothing is highlighted. `nextIndex` is the same
logic as a pure function.

### `useActiveDescendant`

Points a control's `aria-controls` and `aria-activedescendant` at the listbox
and the highlighted option through ARIA element reflection, which reaches across
shadow roots where IDREF attributes can't.

```ts
useActiveDescendant({
	control: () => field.shadowRoot?.querySelector('input'),
	listbox: () => root.querySelector('[role="listbox"]'),
	active: () => root.querySelector(`#option-${activeIndex}`),
	expanded: opened,
});
```

The listbox and options must live in the control's own shadow root or an
**ancestor** one. Browsers ignore references into sibling or descendant shadow
roots; the hook warns in the console when that happens. Requires ARIA element
reflection: Chrome 135, Firefox 136, Safari 16.4.

### `useAnnouncer`

Debounces a message for a polite live region, so a screen reader hears the
result of typing once instead of on every keystroke. Render the region inside
the component: an announcer at page level goes silent while a modal dialog
makes the rest of the page inert.

```ts
const announcement = useAnnouncer(
	opened ? t('{{count}} results', { count }) : '',
);

html`<span class="visually-hidden" aria-live="polite">${announcement}</span>`;
```

An empty message clears the region at once. The delay defaults to 500 ms.

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
