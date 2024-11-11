<script lang="ts">
	import Peer, { type MediaConnection } from 'peerjs';

	export let connectedLocation = 'Waiting to connect...';
	export let connected = false;

	let errorElement: HTMLParagraphElement;
	let errorText: string = '';

	let videoElement: HTMLVideoElement;
	let controlsElement: HTMLDivElement;
	let localId: string;

	function initiateConnection() {
		// hide the controls
		controlsElement.setAttribute('data-hidden', 'true');

		console.log(
			`Connecting to wss://${import.meta.env.VITE_HOST_SERVER}:${import.meta.env.VITE_HOST_PORT}/${import.meta.env.VITE_HOST_PATH}`
		);
		const peer = new Peer(localId, {
			host: import.meta.env.VITE_HOST_SERVER,
			port: parseInt(import.meta.env.VITE_HOST_PORT as string),
			path: import.meta.env.VITE_HOST_PATH,
		});

		// bro what
		// type script fuckery-- peer.socket._socket is private, but we want that existing
		// websocket connection to get notified for who to connect to / expect a call from
		const socket = (peer.socket as unknown as { _socket: WebSocket })._socket;

		let trustedPeer: string | undefined;
		let currentCall: MediaConnection | undefined;
		socket.addEventListener('message', async event => {
			const ev = JSON.parse(event.data);

			switch (ev.type) {
				case 'error':
					connected = false;
					errorText = ev.message;
					errorElement.setAttribute('data-error', 'true');

				case 'call':
					connected = true;

					// if the server tells it to call a new peer, end any current call
					if (currentCall && currentCall.open) currentCall.close();

					// call the new peer
					console.log('Calling', peer);
					const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
					currentCall = peer.call(ev.peer, stream);
					currentCall.on('stream', remoteStream => (videoElement.srcObject = remoteStream));
					break;

				case 'assign':
					connected = true;
					console.log('Got assigned', peer);
					connectedLocation = trustedPeer = ev.peer;
					break;

				case "disconnect":
					connected = false;
					console.log("Disconnecting from previous call");

					if(currentCall && currentCall.open) currentCall.close();
					
					//TODO: Change to show waiting for next call.
			}
		});

		peer.on('call', async incomingCall => {
			if (incomingCall.peer == trustedPeer) {
				const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
				incomingCall.answer(stream);
				incomingCall.on('stream', remoteStream => (videoElement.srcObject = remoteStream));
			}
		});
	}
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<video autoplay bind:this={videoElement} class="absolute h-full w-full object-cover" />

<p
	class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center opacity-0 data-[error]:opacity-100"
	bind:this={errorElement}
>
	Sorry, it looks like something went wrong:
	<br />
	{errorText}
</p>

<div
	class="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-2
			transition-transform ease-in-out data-[hidden]:scale-0"
	bind:this={controlsElement}
>
	<input
		type="text"
		class="border-4 border-dashed border-counterspell-pink bg-counterspell-100 p-3 font-retro text-lg text-white outline-none"
		placeholder="Enter your event name..."
		bind:value={localId}
	/>
	<button class="bg-counterspell-pink p-4 font-retro text-white" on:click={initiateConnection}
		>ENTER THE PORTAL</button
	>
</div>
