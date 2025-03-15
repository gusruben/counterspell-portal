<script lang="ts">
	import Portal from '$lib/Portal.svelte';

	let connectedLocation: string;
	let timer: string;
</script>

<div class="fixed inset-0 flex flex-col items-center gap-10 px-36 py-16">
	<div class="flex flex-row absolute left-14 right-14 top-10 justify-center items-center gap-3">
		<div class="flex flex-row items-center	">
			<img src="/scrapyard-portal.png" alt="Counterspell Portal Logo" class="w-14 h-14 [image-rendering:pixelated] mr-5" />
			<h1 class=" font-moonblossom text-3xl text-scrapyard-text">Hack Club Portal</h1>
		</div>
			<div class="flex-grow"></div>
	<h1 class="font-moonblossom text-3xl text-scrapyard-text opacity-75 w-28">{timer}</h1>
	</div>
	<h1 class="font-moonblossom text-3xl text-scrapyard-text mt-10 capitalize">{connectedLocation}</h1>
	<div
		class="relative h-full w-full z-40"
	>
		<div class="absolute h-full w-[102%] -left-[1%] top-0 bg-[url(/sticky-note.png)] bg-cover"></div>
		<Portal bind:connectedLocation bind:timer/>
	</div>
</div>

<svelte:head>
	<title>{connectedLocation} - Counterspell Portal</title>
</svelte:head>
