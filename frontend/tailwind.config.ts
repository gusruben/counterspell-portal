import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		fontFamily: {
			retro: ['Retro Gaming'],
		},
		extend: {},
	},
	plugins: [],
} as Config;
