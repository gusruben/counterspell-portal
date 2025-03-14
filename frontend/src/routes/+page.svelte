<script lang="ts">
	import Portal from '$lib/Portal.svelte';

	let connectedLocation: string;
	let timer: string;
</script>

<div class="fixed inset-0 flex flex-col items-center gap-10 px-36 py-16">
	<div class="flex flex-row absolute left-14 right-14 top-10 justify-center items-center gap-3">
		<div class="flex flex-row items-center	">
			<img src="/favicon.png" alt="Counterspell Portal Logo" class="w-14 h-14" />
			<h1 class=" font-retro text-3xl text-white">Counterspell Portal</h1>
		</div>
			<div class="flex-grow"></div>
	<h1 class="font-retro text-3xl text-white opacity-75 w-28">{timer}</h1>
	</div>
	<h1 class="font-retro text-3xl text-white mt-10 capitalize">{connectedLocation}</h1>
	<div
		class="relative h-full w-full border-4 border-dashed border-counterspell-pink bg-counterspell-100 z-40"
	>
		<Portal bind:connectedLocation bind:timer/>
	</div>
</div>

<svelte:head>
	<title>{connectedLocation} - Counterspell Portal</title>
</svelte:head>
