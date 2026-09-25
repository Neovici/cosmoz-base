import { html } from '@pionjs/pion';
import { describe, expect, it } from 'vitest';
import {
	ListNavigationOptions,
	nextIndex,
	useListNavigation,
	UseListNavigationOptions,
} from '../src/list-navigation';
import { key, mount, nextFrame, update } from './helpers';

describe('nextIndex', () => {
	const five = { count: 5 };
	const cases: [
		string,
		number,
		string,
		ListNavigationOptions,
		number | undefined,
	][] = [
		['ArrowDown from nothing goes to the first item', -1, 'ArrowDown', five, 0],
		['ArrowUp from nothing goes to the last item', -1, 'ArrowUp', five, 4],
		['ArrowDown moves forward', 1, 'ArrowDown', five, 2],
		['ArrowUp moves back', 2, 'ArrowUp', five, 1],
		['ArrowDown wraps by default', 4, 'ArrowDown', five, 0],
		['ArrowUp wraps by default', 0, 'ArrowUp', five, 4],
		[
			'ArrowDown stays at the end without loop',
			4,
			'ArrowDown',
			{ count: 5, loop: false },
			4,
		],
		[
			'ArrowUp stays at the start without loop',
			0,
			'ArrowUp',
			{ count: 5, loop: false },
			0,
		],
		['Home goes to the first item', 3, 'Home', five, 0],
		['End goes to the last item', 1, 'End', five, 4],
		[
			'Home is ignored with homeEnd off',
			3,
			'Home',
			{ count: 5, homeEnd: false },
			undefined,
		],
		[
			'End is ignored with homeEnd off',
			1,
			'End',
			{ count: 5, homeEnd: false },
			undefined,
		],
		['PageDown is ignored without pageSize', 0, 'PageDown', five, undefined],
		['PageDown moves one page', 0, 'PageDown', { count: 20, pageSize: 5 }, 5],
		[
			'PageDown stops at the last item',
			17,
			'PageDown',
			{ count: 20, pageSize: 5 },
			19,
		],
		[
			'PageDown from nothing lands on the last item of the first page',
			-1,
			'PageDown',
			{ count: 20, pageSize: 5 },
			4,
		],
		['PageUp moves one page', 12, 'PageUp', { count: 20, pageSize: 5 }, 7],
		[
			'PageUp stops at the first item',
			3,
			'PageUp',
			{ count: 20, pageSize: 5 },
			0,
		],
		['other keys are ignored', 1, 'a', five, undefined],
		[
			'an empty list ignores every key',
			-1,
			'ArrowDown',
			{ count: 0 },
			undefined,
		],
	];

	it.each(cases)('%s', (_, current, k, options, expected) => {
		expect(nextIndex(current, k, options)).toBe(expected);
	});

	describe('disabled items', () => {
		const isDisabled = (i: number) => [0, 2, 4].includes(i);
		const options = { count: 6, isDisabled };

		it('are skipped moving forward', () => {
			expect(nextIndex(1, 'ArrowDown', options)).toBe(3);
		});

		it('are skipped moving back', () => {
			expect(nextIndex(3, 'ArrowUp', options)).toBe(1);
		});

		it('are skipped when wrapping', () => {
			expect(nextIndex(5, 'ArrowDown', options)).toBe(1);
		});

		it('are skipped by Home and End', () => {
			expect(nextIndex(3, 'Home', options)).toBe(1);
			expect(nextIndex(1, 'End', { count: 5, isDisabled })).toBe(3);
		});

		it('keep the current item without loop when nothing enabled follows', () => {
			expect(
				nextIndex(3, 'ArrowDown', { count: 5, isDisabled, loop: false }),
			).toBe(3);
		});

		it('make a page jump fall back to the nearest enabled item', () => {
			expect(
				nextIndex(1, 'PageDown', { count: 6, pageSize: 3, isDisabled }),
			).toBe(5);
			expect(
				nextIndex(5, 'PageUp', { count: 6, pageSize: 1, isDisabled }),
			).toBe(3);
		});

		it('give -1 when every item is disabled', () => {
			expect(
				nextIndex(-1, 'ArrowDown', { count: 3, isDisabled: () => true }),
			).toBe(-1);
		});
	});
});

type Nav = ReturnType<typeof useListNavigation>;

const navs = new WeakMap<HTMLElement, Nav>();

const List = (host: HTMLElement & UseListNavigationOptions) => {
	const { count, defaultIndex, loop, pageSize, homeEnd, isDisabled } = host;
	const nav = useListNavigation({
		count,
		defaultIndex,
		loop,
		pageSize,
		homeEnd,
		isDisabled,
	});
	navs.set(host, nav);
	return html`<input @keydown=${nav.onKeyDown} />`;
};

const setup = async (props: UseListNavigationOptions) => {
	const el = await mount(List, props);
	const nav = () => navs.get(el)!;
	const input = el.shadowRoot!.querySelector('input')!;
	const press = async (k: string, init?: KeyboardEventInit) => {
		const e = key(input, k, init);
		await nextFrame();
		return e;
	};
	return { el, nav, press };
};

describe('useListNavigation', () => {
	it('starts at defaultIndex', async () => {
		const { nav } = await setup({ count: 5, defaultIndex: 2 });
		expect(nav().activeIndex).toBe(2);
	});

	it('starts with nothing highlighted by default', async () => {
		const { nav } = await setup({ count: 5 });
		expect(nav().activeIndex).toBe(-1);
	});

	it('moves on navigation keys and prevents their default', async () => {
		const { nav, press } = await setup({ count: 5 });
		const e = await press('ArrowDown');
		expect(e.defaultPrevented).toBe(true);
		await press('ArrowDown');
		expect(nav().activeIndex).toBe(1);
		await press('End');
		expect(nav().activeIndex).toBe(4);
	});

	it('leaves other keys alone', async () => {
		const { nav, press } = await setup({ count: 5, defaultIndex: 1 });
		const e = await press('Enter');
		expect(e.defaultPrevented).toBe(false);
		expect(nav().activeIndex).toBe(1);
	});

	it.each(['altKey', 'ctrlKey', 'metaKey', 'shiftKey'])(
		'ignores keys with %s',
		async (modifier) => {
			const { nav, press } = await setup({ count: 5, defaultIndex: 1 });
			const e = await press('ArrowDown', { [modifier]: true });
			expect(e.defaultPrevented).toBe(false);
			expect(nav().activeIndex).toBe(1);
		},
	);

	it('clamps the highlight when the list shrinks', async () => {
		const { el, nav, press } = await setup({ count: 5 });
		await press('End');
		await update(el, { count: 3 });
		expect(nav().activeIndex).toBe(2);
		await update(el, { count: 5 });
		expect(nav().activeIndex).toBe(2);
	});

	it('clears the highlight when the list empties and restores defaultIndex after', async () => {
		const { el, nav } = await setup({ count: 5, defaultIndex: 0 });
		await update(el, { count: 0 });
		expect(nav().activeIndex).toBe(-1);
		await update(el, { count: 3 });
		expect(nav().activeIndex).toBe(0);
	});

	it('applies a new defaultIndex when nothing is highlighted', async () => {
		const { el, nav } = await setup({ count: 5 });
		await update(el, { defaultIndex: 0 });
		expect(nav().activeIndex).toBe(0);
	});

	it('keeps the highlight when defaultIndex changes', async () => {
		const { el, nav, press } = await setup({ count: 5 });
		await press('End');
		await update(el, { defaultIndex: 0 });
		expect(nav().activeIndex).toBe(4);
	});

	it('lets the caller set the highlight, e.g. on hover', async () => {
		const { nav } = await setup({ count: 5 });
		nav().setActiveIndex(3);
		await nextFrame();
		expect(nav().activeIndex).toBe(3);
	});
});
