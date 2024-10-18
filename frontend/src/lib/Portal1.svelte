<script lang="ts">
	import Peer, { type MediaConnection } from 'peerjs';

	export let connectedLocation = 'Waiting to connect...';
	export let connected = false;

	// COMPUTER

	let videoElement: HTMLVideoElement;
	let controlsElement: HTMLDivElement;
	let localId: string = "Computer";

	async function initiateConnection() {
		// hide the controls
		controlsElement.setAttribute('data-hidden', 'true');

		console.log(
			`Connecting to wss://${import.meta.env.VITE_HOST_SERVER}:${import.meta.env.VITE_HOST_PORT}`
		);
		const peer = new Peer(localId, {
			host: import.meta.env.VITE_HOST_SERVER,
			port: parseInt(import.meta.env.VITE_HOST_PORT as string),
			path: '/',
		});

		const getFromPhone = new Peer("PhoneSendHere", {
			host: import.meta.env.VITE_HOST_SERVER,
			port: parseInt(import.meta.env.VITE_HOST_PORT as string),
			path: '/',
		})

		let currentCall: MediaConnection | undefined;
		let fromPhone: MediaConnection | undefined;

		const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
		currentCall = peer.call("Smartboard", stream);
		connectedLocation = "Smartboard"
		currentCall.on('stream', (remoteStream: any) => {});

		fromPhone = getFromPhone.call("Phone", stream);
		fromPhone.on('stream', remoteStream => (videoElement.srcObject = remoteStream))
	}
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<video autoplay bind:this={videoElement} class="absolute h-full w-full object-cover" />

<div
	class="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-2
			transition-transform ease-in-out data-[hidden]:scale-0"
	bind:this={controlsElement}
>
	<input
		type="text"
		class="border-4 border-dashed border-counterspell-pink bg-counterspell-100 p-3 font-retro text-lg text-white outline-none"
		placeholder="Enter your event name..."
	/>
	<button class="bg-counterspell-pink p-4 font-retro text-white" on:click={initiateConnection}
		>ENTER THE PORTAL</button
	>
</div>
