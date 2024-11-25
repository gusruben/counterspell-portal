<script lang="ts">
	import Portal from '$lib/Portal.svelte';
	import { onMount } from 'svelte';
	import { Toaster, toast } from 'svelte-sonner'

	let connectedLocation: string;
	let timer: string;

	let lastMessageCheck = Date.now();

	async function checkMessages() {
		const messages = await (await fetch("/messages")).json();
		for (let timestamp of Object.keys(messages)) {
			console.log(timestamp, lastMessageCheck)
			if (Number.parseInt(timestamp) > lastMessageCheck) {
				console.log("New message:", timestamp, messages[timestamp]);
				toast(messages[timestamp], {
					duration: Number.POSITIVE_INFINITY
				});
			}
		}

		lastMessageCheck = Date.now();
	}

	onMount(() => {
		setInterval(checkMessages, 5000);
	})
</script>

<Toaster toastOptions={{
	unstyled: true,
	classes: {
		toast: "bg-[#0A081E] rounded-none border-counterspell-pink border-4 border-dashed text-white text-xl font-retro px-3"
	}
}}/>

<div class="fixed inset-0 flex flex-col items-center gap-10  px-36 py-16 ">
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
</div>

<svelte:head>
	<title>{connectedLocation} - Counterspell Portal</title>
</svelte:head>
