import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		fontFamily: {
			moonblossom: ['moonblossom', 'sans-serif'],
			stanyan: ['p22-stanyan', 'sans-serif'],
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
				scrapyard: {
					text: "#1f2d3d",
					green: "#337d78",
				}
			},
		},
	},
	plugins: [],
} as Config;
