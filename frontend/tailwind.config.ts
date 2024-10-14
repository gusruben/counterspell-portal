import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		fontFamily: {
			retro: ['Retro Gaming'],
		},
		extend: {
			colors: {
				'counterspell-pink': '#FF4186',
				'counterspell-blue': '#41DDFF',
				counterspell: {
					100: '#0A081E',
					200: '#1B192B',
					500: '#202f53',
				},
			},
		},
	},
	plugins: [],
} as Config;
