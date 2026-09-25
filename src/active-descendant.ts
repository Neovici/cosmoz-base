import { useLayoutEffect } from '@pionjs/pion';

type Target = () => Element | null | undefined;

export interface ActiveDescendantOptions {
	/** The focused element, typically the native input (it may sit in a nested shadow root). */
	control: Target;
	listbox: Target;
	/** The highlighted option. */
	active: Target;
	expanded: boolean;
}

const supported =
	typeof Element !== 'undefined' &&
	'ariaActiveDescendantElement' in Element.prototype;

const clear = (el: Element) => {
	el.ariaControlsElements = null;
	el.ariaActiveDescendantElement = null;
};

/**
 * Points the control's aria-controls and aria-activedescendant at the listbox
 * and highlighted option through ARIA element reflection, which, unlike IDREF
 * attributes, reaches across shadow roots. The targets must live in the
 * control's own scope or an ancestor scope; browsers ignore anything else.
 */
export const useActiveDescendant = ({
	control,
	listbox,
	active,
	expanded,
}: ActiveDescendantOptions) => {
	useLayoutEffect(() => {
		const el = control();
		if (!supported || !el) return;
		if (!expanded) return clear(el);

		const list = listbox(),
			option = active() ?? null;
		el.ariaControlsElements = list ? [list] : null;
		el.ariaActiveDescendantElement = option;

		if (option && el.ariaActiveDescendantElement !== option) {
			// eslint-disable-next-line no-console
			console.warn(
				'useActiveDescendant: the active option is outside the scope of the control. Render it in the same or an ancestor shadow root.',
			);
		}
	});

	useLayoutEffect(
		() => () => {
			const el = control();
			if (supported && el) clear(el);
		},
		[],
	);
};
