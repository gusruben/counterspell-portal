<script lang="ts">
	import Portal from '$lib/Portal.svelte';

	let connectedLocation: string;
	// placeholder for now
	const timeLeft = '12:31';
</script>

<div class="fixed inset-0 flex flex-col items-center gap-10 bg-counterspell-500 p-10">
	<h1 class="font-retro text-3xl text-white">{connectedLocation}</h1>
	<h1 class="absolute right-14 top-10 font-retro text-3xl text-white opacity-75">{timeLeft}</h1>
	<div
		class="relative h-full w-full border-4 border-dashed border-counterspell-pink bg-counterspell-100"
	>
		<Portal bind:connectedLocation />
	</div>
</div>

<svelte:head>
	<title>Counterspell Portal - {connectedLocation}</title>
</svelte:head>
