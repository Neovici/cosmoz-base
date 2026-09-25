import { html } from '@pionjs/pion';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useActiveDescendant } from '../src/active-descendant';
import { mount, nextFrame, update } from './helpers';

// Stands in for cosmoz-input: the native input sits in the field's own shadow root.
customElements.define(
	'test-field',
	class extends HTMLElement {
		constructor() {
			super();
			this.attachShadow({ mode: 'open' }).innerHTML = '<input />';
		}
	},
);

// Stands in for today's cosmoz-listbox: options inside a nested shadow root.
customElements.define(
	'test-nested-listbox',
	class extends HTMLElement {
		constructor() {
			super();
			this.attachShadow({ mode: 'open' }).innerHTML =
				'<div role="listbox"><div role="option">A</div><div role="option">B</div></div>';
		}
	},
);

interface Props {
	expanded: boolean;
	active: number;
	nested?: boolean;
}

const Combobox = (host: HTMLElement & Props) => {
	const root = host.shadowRoot!;
	const options = () =>
		host.nested ? root.querySelector('test-nested-listbox')!.shadowRoot! : root;

	useActiveDescendant({
		control: () =>
			root.querySelector('test-field')?.shadowRoot?.querySelector('input'),
		listbox: () => options().querySelector('[role="listbox"]'),
		active: () => options().querySelectorAll('[role="option"]')[host.active],
		expanded: host.expanded,
	});

	return html`<test-field></test-field> ${
			host.nested
				? html`<test-nested-listbox></test-nested-listbox>`
				: html`<div role="listbox">
						<div role="option">A</div>
						<div role="option">B</div>
					</div>`
		}`;
};

const setup = async (props: Props) => {
	const el = await mount(Combobox, props);
	await nextFrame();
	const root = el.shadowRoot!;
	return {
		el,
		input: root
			.querySelector('test-field')!
			.shadowRoot!.querySelector('input')!,
		listbox: root.querySelector('[role="listbox"]'),
		options: root.querySelectorAll('[role="option"]'),
	};
};

describe('useActiveDescendant', () => {
	afterEach(() => vi.restoreAllMocks());

	it('points the control at the listbox and active option in an ancestor scope', async () => {
		const { input, listbox, options } = await setup({
			expanded: true,
			active: 1,
		});
		expect(input.ariaActiveDescendantElement).toBe(options[1]);
		expect(input.ariaControlsElements).toEqual([listbox]);
	});

	it('follows the active option', async () => {
		const { el, input, options } = await setup({ expanded: true, active: 0 });
		expect(input.ariaActiveDescendantElement).toBe(options[0]);
		await update(el, { active: 1 });
		expect(input.ariaActiveDescendantElement).toBe(options[1]);
	});

	it('clears both references while collapsed', async () => {
		const { el, input } = await setup({ expanded: true, active: 0 });
		await update(el, { expanded: false });
		expect(input.ariaActiveDescendantElement).toBeNull();
		expect(input.ariaControlsElements).toBeNull();
	});

	it('clears the active option when none is highlighted', async () => {
		const { input, listbox } = await setup({ expanded: true, active: -1 });
		expect(input.ariaActiveDescendantElement).toBeNull();
		expect(input.ariaControlsElements).toEqual([listbox]);
	});

	it('clears both references on disconnect', async () => {
		const { el, input } = await setup({ expanded: true, active: 1 });
		el.remove();
		await nextFrame();
		expect(input.ariaActiveDescendantElement).toBeNull();
		expect(input.ariaControlsElements).toBeNull();
	});

	it('warns when the option lives in a sibling shadow root the browser ignores', async () => {
		const warn = vi.spyOn(console, 'warn').mockReturnValue(undefined);
		const { input } = await setup({ expanded: true, active: 1, nested: true });
		expect(input.ariaActiveDescendantElement).toBeNull();
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('outside the scope of the control'),
		);
	});
});
