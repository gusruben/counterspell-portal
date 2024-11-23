<script lang="ts">
	import Peer, { type MediaConnection } from 'peerjs';

	export let connectedLocation = 'Waiting to connect...';
	export let connected = false;

	let errorElement: HTMLParagraphElement;
	let errorText: string = '';

	let videoElement: HTMLVideoElement;
	let controlsElement: HTMLDivElement;
	let localId: string;

	const cities = [
		'Visakhapatnam', 'Chandigarh', 'Bydgoszcz', 'Dubai', 'London', 'Tampa',
		'Boston', 'Saint Augustine', 'Oshkosh', 'Toronto', 'Auckland', 'Silicon Valley',
		'Seoul', 'Chennai', 'Manassas', 'Atlanta', 'San Diego', 'Dhaka', 'Delhi',
		'Singapore', 'Vidisha', 'Alexandria', 'Lahore', 'Cambridge', 'Sydney', 'Nairobi',
		'Rwamagana', 'Ottawa', 'Washington DC', 'Columbus', 'Casablanca', 'Nablus',
		'Vancouver', 'New York', 'Phoenix', 'Winnipeg', 'Busan', 'Hong Kong', 'Bergen',
		'Giza', 'Austin', 'Wolverhampton', 'Muzaffarpur', 'Patna', 'Moses Lake', 'Lima',
		'Bengaluru', 'El Paso', 'Valenzuela'
	];

	function initiateConnection() {
		localId = localId.trim().toLowerCase();
		if (!localId) {
			errorText = 'Please enter your event name.';
			errorElement.setAttribute('data-error', 'true');
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

		let trustedPeer: string | undefined;
		let currentCall: MediaConnection | undefined;
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

					console.log('Calling', ev.peer);
					const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
					currentCall = peer.call(ev.peer, stream);
					currentCall.on('stream', remoteStream => (videoElement.srcObject = remoteStream));
					break;

				case 'assign':
					connected = true;
					console.log('Got assigned', ev.peer);
					trustedPeer = ev.peer;
					break;

				case "disconnect":
					connected = false;
					console.log("Disconnecting from previous call");

					if(currentCall && currentCall.open) currentCall.close();
					
					// Show waiting message or UI
					connectedLocation = 'Waiting for next call...';
					controlsElement.removeAttribute('data-hidden');
					break;
			}
		});

		peer.on('call', async incomingCall => {
			if (incomingCall.peer == trustedPeer) {
				const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
				incomingCall.answer(stream);
				incomingCall.on('stream', remoteStream => (videoElement.srcObject = remoteStream));

				connectedLocation = trustedPeer;
			}
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
</script>

<video autoplay bind:this={videoElement} class="absolute h-full w-full object-cover" />

<p
	class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center opacity-0 data-[error]:opacity-100"
	bind:this={errorElement}
>
	{errorText}
</p>

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
	<button class="bg-counterspell-pink p-4 font-retro text-white" on:click={initiateConnection}
		>ENTER THE PORTAL</button
	>
</div>