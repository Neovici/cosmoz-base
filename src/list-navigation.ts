import { useEffect, useState } from '@pionjs/pion';

export interface ListNavigationOptions {
	count: number;
	/** Wrap from the last item to the first and back. Defaults to true. */
	loop?: boolean;
	/** Items to move on PageUp/PageDown. Those keys are ignored when unset. */
	pageSize?: number;
	/** Handle Home/End. Turn off where they should move the text caret. Defaults to true. */
	homeEnd?: boolean;
	isDisabled?: (index: number) => boolean;
}

interface Search {
	count: number;
	loop: boolean;
	isDisabled?: (index: number) => boolean;
}

const findEnabled = (
	start: number,
	step: 1 | -1,
	{ count, loop, isDisabled }: Search,
) => {
	for (let n = 0, i = start; n < count; n++, i += step) {
		if (loop) i = (i + count) % count;
		else if (i < 0 || i >= count) return -1;
		if (!isDisabled?.(i)) return i;
	}
	return -1;
};

/**
 * The index a navigation key moves to, `-1` when no item is enabled, or
 * `undefined` when the key isn't a navigation key.
 */
export const nextIndex = (
	current: number,
	key: string,
	{
		count,
		loop = true,
		pageSize,
		homeEnd = true,
		isDisabled,
	}: ListNavigationOptions,
): number | undefined => {
	if (count <= 0) return;

	const bounded = { count, loop: false, isDisabled },
		first = () => findEnabled(0, 1, bounded),
		last = () => findEnabled(count - 1, -1, bounded),
		none = current < 0 || current >= count,
		step = (dir: 1 | -1) => {
			const next = findEnabled(current + dir, dir, { ...bounded, loop });
			return next === -1 ? current : next;
		},
		page = (target: number, dir: 1 | -1) => {
			const next = findEnabled(target, dir, bounded);
			return next === -1
				? findEnabled(target, dir === 1 ? -1 : 1, bounded)
				: next;
		};

	switch (key) {
		case 'ArrowDown':
			return none ? first() : step(1);
		case 'ArrowUp':
			return none ? last() : step(-1);
		case 'Home':
			return homeEnd ? first() : undefined;
		case 'End':
			return homeEnd ? last() : undefined;
		case 'PageDown':
			if (!pageSize) return;
			return page(Math.min(count - 1, (none ? -1 : current) + pageSize), 1);
		case 'PageUp':
			if (!pageSize) return;
			return page(Math.max(0, (none ? count : current) - pageSize), -1);
	}
};

export interface UseListNavigationOptions extends ListNavigationOptions {
	/** Highlighted when nothing is, e.g. `0` once the user has typed a query. Defaults to -1. */
	defaultIndex?: number;
}

export const useListNavigation = ({
	defaultIndex = -1,
	...options
}: UseListNavigationOptions) => {
	const { count } = options,
		[index, setActiveIndex] = useState(defaultIndex),
		activeIndex = Math.min(index, count - 1);

	useEffect(
		() =>
			setActiveIndex((i) => (i < 0 ? defaultIndex : Math.min(i, count - 1))),
		[count, defaultIndex],
	);

	return {
		activeIndex,
		setActiveIndex,
		/** Returns true when it handled the key (and called preventDefault). */
		onKeyDown: (e: KeyboardEvent) => {
			if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return false;
			const next = nextIndex(activeIndex, e.key, options);
			if (next === undefined) return false;
			e.preventDefault();
			setActiveIndex(next);
			return true;
		},
	};
};
