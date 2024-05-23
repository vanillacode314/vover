import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import UnoCSS from 'unocss/vite';
import extractorSvelte from '@unocss/extractor-svelte';
import presetIcons from '@unocss/preset-icons';
import presetWebFonts from '@unocss/preset-web-fonts';

export default defineConfig({
	plugins: [
		UnoCSS({
			extractors: [extractorSvelte()],
			presets: [presetWebFonts(), presetIcons()]
		}),
		sveltekit()
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	optimizeDeps: {
		exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
	},
	server: {
		headers: {
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp'
		}
	}
});
