<script lang="ts">
	import Peer, { type MediaConnection } from 'peerjs';
	import { onMount } from 'svelte';
	import { cities } from '$lib';

	export let connectedLocation = 'Waiting to connect...';
	export let connected = false;

	let errorElement: HTMLParagraphElement;
	let errorText: string = '';

	let videoElement: HTMLVideoElement;
	let controlsElement: HTMLDivElement;
	let passwordInput: HTMLInputElement;
	let localId: string;
	let firstConnect = false;

	let currentCall:  MediaConnection | undefined;

	export let timer = "00:00";
	let timeLeft = import.meta.env.INTERVAL * 60 * 1000;

	async function refreshTimer() {
		console.log("refreshing timer!")
		const res = await fetch(`/lastRefresh`);
		const { refresh } = await res.json();
		timeLeft = (import.meta.env.VITE_INTERVAL * 60 * 1000) - (Date.now() - refresh);
		console.log("initial time left:", timeLeft)
		updateTimer();
	}

	function updateTimer() {
		// if (Number.isNaN(timeLeft)) {
		// 	timer = "00:00";
		// 	return;
		// }
		let seconds = String(Math.floor(timeLeft / 1000) % 60);
		if (Math.floor(timeLeft / 1000) % 60 < 10) {
			seconds = "0" + seconds;
		}
		timer = `${Math.floor((timeLeft / 1000) / 60)}:${seconds}`
		timeLeft -= 1000;
		if (timeLeft <= 0) {
			timeLeft = (import.meta.env.VITE_INTERVAL * 60 * 1000)
		}
	}

	function initiateConnection() {
		localId = localId.trim().toLowerCase();
		if (!localId) {
			errorText = 'Please enter your event name.';
			errorElement.setAttribute('data-error', 'true');
			return;
		}

		firstConnect = true;

		if (passwordInput.value != import.meta.env.VITE_AUTH_TOKEN) {
			return;
		}

		controlsElement.setAttribute('data-hidden', 'true');

		console.log(
			`Connecting to wss://${import.meta.env.VITE_HOST_SERVER}:${import.meta.env.VITE_HOST_PORT}/${import.meta.env.VITE_HOST_PATH}`
		);
		const peer = new Peer(localId, {
			host: import.meta.env.VITE_HOST_SERVER,
			port: parseInt(import.meta.env.VITE_HOST_PORT as string),
			path: import.meta.env.VITE_HOST_PATH,
		});

		const socket = (peer.socket as unknown as { _socket: WebSocket })._socket;

		socket.addEventListener('message', async event => {
			const ev = JSON.parse(event.data);

			switch (ev.type) {
				case 'error':
					connected = false;
					errorText = ev.message;
					errorElement.setAttribute('data-error', 'true');
					break;

				case 'call':
					connected = true;

					if (currentCall && currentCall.open) currentCall.close();

					console.log('Calling', ev.data.id);
					const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
					currentCall = peer.call(ev.data.id, stream);
					currentCall.on('stream', remoteStream => (videoElement.srcObject = remoteStream));
					currentCall.on('close', () => {
						videoElement.srcObject = null;
						currentCall = undefined;
					});

					connectedLocation = ev.data.id;
					refreshTimer();
					
					break;

				case 'assign':
					connected = true;
					console.log('Got assigned', ev.data.id);
					connectedLocation = ev.data.id;
					connectedLocation = connectedLocation.charAt(0).toUpperCase() + connectedLocation.slice(1);

					refreshTimer();
					break;

				case "disconnect":
					connected = false;
					console.log("Disconnecting from previous call");

					if(currentCall && currentCall.open) currentCall.close();
					currentCall = undefined;
					
					// Show waiting message or UI
					connectedLocation = 'Waiting for next call...';
					controlsElement.removeAttribute('data-hidden');

					videoElement.srcObject = null;
					break;
			}
		});

		peer.on('call', async incomingCall => {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

			currentCall = incomingCall
			incomingCall.answer(stream);
			incomingCall.on('stream', remoteStream => (videoElement.srcObject = remoteStream));

			incomingCall.on('close', () => {
				videoElement.srcObject = null;
				currentCall = undefined;
			});
		});

		peer.on('error', err => {
			console.error('Peer error:', err);
			errorText = err.type === 'unavailable-id' 
			  ? 'A client from your city is already connected!'
			  : 'An error occurred: ' + err.message;
			errorElement.setAttribute('data-error', 'true');
			controlsElement.removeAttribute('data-hidden');
		});
	}

	onMount(() => {
		refreshTimer();
		setInterval(updateTimer, 1000);
	})
</script>

<div class="absolute h-full w-full overflow-hidden">
	<video autoplay bind:this={videoElement} class="absolute h-full w-full object-cover" />
</div>


<p
	class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center opacity-0 data-[error]:opacity-100"
	bind:this={errorElement}
>
	<!-- {errorText} -->
</p>

{#if firstConnect && !currentCall}
	<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-retro">
		<p class="text-center text-counterspell-pink text-3xl mx-auto w-max">You'll be connected shortly...</p>
		<p class="text-center text-white text-xl opacity-70 mx-auto w-max">If it's taking a while, there might be an odd number of events!</p>
	</div>
{/if}

{#if !firstConnect}
	<div
		class="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-2
				transition-transform ease-in-out data-[hidden]:scale-0"
		bind:this={controlsElement}
	>
		<select
			class="border-4 border-dashed border-counterspell-pink bg-counterspell-100 p-3 font-retro text-lg text-white outline-none"
			bind:value={localId}
			>
			<option value="" disabled selected>Select your event city...</option>
			{#each cities as city}
				<option value={city}>{city}</option>
			{/each}
		</select>
		<input type="password" class="border-4 border-dashed border-counterspell-pink bg-counterspell-100 p-3 font-retro text-lg text-white outline-none" placeholder="Auth Token" bind:this={passwordInput}>
		<button class="bg-counterspell-pink p-4 font-retro text-white" on:click={initiateConnection}
			>ENTER THE PORTAL</button
		>
	</div>
{/if}