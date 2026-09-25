import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Playwright's Firefox doesn't launch on every dev machine; CI covers all engines.
const browsers = process.env.CI
	? (['chromium', 'firefox', 'webkit'] as const)
	: (['chromium'] as const);

export default defineConfig({
	test: {
		include: ['test/**/*.test.ts'],
		passWithNoTests: true,
		browser: {
			enabled: true,
			provider: playwright({}),
			headless: true,
			instances: browsers.map((browser) => ({ browser })),
		},
	},
});
