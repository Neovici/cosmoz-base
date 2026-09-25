import { html } from '@pionjs/pion';
import { describe, expect, it } from 'vitest';
import { useAnnouncer } from '../src/announcer';
import { mount, nextFrame, update } from './helpers';

interface Props {
	message: string;
	delay?: number;
}

const Status = (host: HTMLElement & Props) =>
	html`<span aria-live="polite"
		>${useAnnouncer(host.message, host.delay)}</span
	>`;

const text = (el: HTMLElement) =>
	el.shadowRoot!.querySelector('span')!.textContent!.trim();

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('useAnnouncer', () => {
	it('announces a message after the delay', async () => {
		const el = await mount(Status, { message: '3 results', delay: 50 });
		expect(text(el)).toBe('');
		await wait(80);
		await nextFrame();
		expect(text(el)).toBe('3 results');
	});

	it('only announces the last of several quick messages', async () => {
		const el = await mount(Status, { message: '10 results', delay: 60 });
		const seen: string[] = [];
		const observer = new MutationObserver(() => seen.push(text(el)));
		observer.observe(el.shadowRoot!, {
			subtree: true,
			childList: true,
			characterData: true,
		});
		await update(el, { message: '4 results' });
		await update(el, { message: '1 result' });
		await wait(90);
		await nextFrame();
		observer.disconnect();
		expect(text(el)).toBe('1 result');
		expect(seen.filter(Boolean)).toEqual(['1 result']);
	});

	it('clears at once when the message is empty', async () => {
		const el = await mount(Status, { message: '3 results', delay: 20 });
		await wait(50);
		await nextFrame();
		expect(text(el)).toBe('3 results');
		await update(el, { message: '' });
		expect(text(el)).toBe('');
	});

	it('defaults to a 500 ms delay', async () => {
		const el = await mount(Status, { message: '3 results' });
		await wait(250);
		await nextFrame();
		expect(text(el)).toBe('');
		await wait(350);
		await nextFrame();
		expect(text(el)).toBe('3 results');
	});
});
