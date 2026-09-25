import { component } from '@pionjs/pion';

let id = 0;

export const nextFrame = () =>
	new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
	);

export const mount = async <P extends object>(
	renderer: (host: HTMLElement & P) => unknown,
	props: P,
) => {
	const tag = `test-el-${++id}`;
	customElements.define(
		tag,
		component(renderer as (host: HTMLElement) => unknown),
	);
	const el = Object.assign(document.createElement(tag), props) as HTMLElement &
		P;
	document.body.append(el);
	await nextFrame();
	return el;
};

export const update = async <P extends object>(
	el: HTMLElement & P,
	props: Partial<P>,
) => {
	Object.assign(el, props);
	await nextFrame();
};

export const key = (
	target: EventTarget,
	key: string,
	init: KeyboardEventInit = {},
) => {
	const e = new KeyboardEvent('keydown', {
		key,
		bubbles: true,
		composed: true,
		cancelable: true,
		...init,
	});
	target.dispatchEvent(e);
	return e;
};
