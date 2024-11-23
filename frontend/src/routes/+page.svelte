<script lang="ts">
	import Portal from '$lib/Portal.svelte';

	let connectedLocation: string;
	let timer: string;
</script>

<div class="fixed inset-0 flex flex-col items-center gap-10 bg-counterspell-500 px-36 py-16 ">
	<div class="flex flex-row absolute left-14 top-10 justify-center items-center">
		<img src="/favicon.png" alt="Counterspell Portal Logo" class="w-14 h-14" />
		<h1 class=" font-retro text-3xl text-white">Counterspell Portal</h1>
	</div>
	<h1 class="font-retro text-3xl text-white mt-10 capitalize">{connectedLocation}</h1>
	<h1 class="absolute right-14 top-12 font-retro text-3xl text-white opacity-75">{timer}</h1>
	<div
		class="relative h-full w-full border-4 border-dashed border-counterspell-pink bg-counterspell-100 z-40"
	>
		<Portal bind:connectedLocation bind:timer/>
	</div>
	<div class="absolute bottom-0 z-10 w-full h-2/5">
		<img src="/city.png" alt="City Background" class="w-full h-full object-cover" />
	</div>
</div>

<p class="absolute bottom-5 left-1/2 -translate-x-1/2 font-retro text-white opacity-20 hover:opacity-50 text-sm transition-all">
	Made with ❤️ by <a class="underline" href="https://github.com/gusruben">Gus</a>, <a class="underline" href="https://github.com/TesDevelopment">Josh</a>, & <a class="underline" href="https://github.com/thedev132">Mohamad</a>
</p>

<svelte:head>
	<title>Counterspell Portal - {connectedLocation}</title>
</svelte:head>
