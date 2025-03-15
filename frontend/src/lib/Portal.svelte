<script lang="ts">
	import { onMount } from 'svelte';
	import { cities } from '$lib';
	import { io, Socket } from "socket.io-client";
	import { toast } from 'svelte-sonner';

	export let connectedLocation = 'Waiting to connect...';
	// export let connected = false;
	const eventRunning = true; // if this is true, portal is disabled and a message is shown instead
	
	// html vars
	let errorElement: HTMLParagraphElement;
	let errorText: string = '';
	let videoElement: HTMLVideoElement;
	let controlsElement: HTMLDivElement;
	let passwordInput: HTMLInputElement;
	let localId: string;

	// state vars
	let socket: Socket;
	let firstConnect = false; // is this current connection the first one? (before any calls)
	let streamID: string | undefined;
	let clientStreamReady = false;
	let connectedStreamID: string | undefined;

	// server/info vars
	const serverURL = `//${import.meta.env.VITE_BACKEND_HOST}:${import.meta.env.VITE_BACKEND_PORT}`;
	let swapInterval: number;
	export let timer = "...";
	let timeLeft: number = NaN;
	let eventCount: number | null = null;

	// helpers
	function error(message: string) {
		console.error("Portal error:", message);
		errorText = message;
		console.log(errorElement);
		errorElement.setAttribute("data-error", "true");
	}
	function toastLog(message: string) {
		toast(message);
		console.log(message);
	}

	async function refreshTimer() {
		console.log("refreshing timer from server!")

		const res = await fetch(`${serverURL}/last-swap`);
		const { lastSwapTime } = await res.json();
		timeLeft = (swapInterval * 60 * 1000) - (Date.now() - lastSwapTime);
		console.log("initial time left:", timeLeft)	
	}

	function updateTimer() {
		if (isNaN(timeLeft)) {
			timer = "??:??";
			return;
		}

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

	async function updateEventCount() {
		const res = await fetch(`${serverURL}/get-event-count`);
		eventCount = parseInt(await res.text());
		console.log("updated event count:", eventCount);
	}

	/** ui functionality for preparing to start the call */
	async function handleReady() {
		localId = localId.trim().toLowerCase();
		if (!localId) {
			error("Please select your event city.");
			return;
		}

		// check auth
		const res = await fetch(`${serverURL}/check-auth`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ auth: passwordInput.value })
		});
		if (res.status == 403) {
			error("Invalid auth token.");
			return;
		} else if (res.status != 200) {
			error("Something went wrong, check the console and let us know?");
			return;
		}
		console.log("Authenticated successfully.");

		controlsElement.setAttribute('data-hidden', 'true');

		initiateConnection();
	}

	onMount(async () => {
		console.log("Server URL:", serverURL);
		
		if (eventRunning) {
			const res = await fetch(`${serverURL}/get-swap-interval`);
			// swapInterval = ;
			swapInterval = parseFloat(await res.text());

			refreshTimer();
			setInterval(updateTimer, 1000);
			setInterval(updateEventCount, 60 * 1000);
		}
	})


	// ----- portal starts logic here -----
	function initiateConnection() {
		console.log(`Connecting to ${serverURL}...`);

		socket = io(serverURL, {
			auth: { city: localId, authToken: passwordInput.value }
		});

		socket.on("setup", async incomingStreamID => {
			streamID = incomingStreamID;
			await fetch(`${window.location.protocol}//${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/v3/config/paths/add/${streamID}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: streamID }),
			});
		})
		socket.on("call", data => {
			console.log("GOT A CALL WEE WOO WEE WOO")
			const { stream, city } = data;
			console.log("Assigned to city:", city);
			connectedStreamID = stream;
			connectedLocation = city;
		})
		
		// simple connection events
		socket.on("connect", () => {
			toastLog("Connected to server!");
		});
		socket.on("connect_error", error => {
			toast("Connection error: " + error.message + "\nReconnecting...");
			console.error("Connection error:", error);
		})
		socket.on("reconnect", attempts => {
			toast(`Reconnected after ${attempts} attempts!`)
		})
		socket.on("disconnect_error", reason => {
			toastLog("Disconnected from server: " + reason);
			socket.disconnect();
		});
	}

	// messaging with stream iframe
	function onMessage(message: MessageEvent) {
		console.log(message, message.data)
		const { type, data } = message.data;
		
		switch (type) {
			case "error":
				error(data);
				break;
			case "ready":
				clientStreamReady = true;
				console.log("socket:", socket);
				socket.emit("ready");
				break;
			default:
				console.warn("Unknown message type:", type, message.data);
		}
	}
	onMount(() => window.addEventListener("message", onMessage));
</script>

<!-- error modal -->
<div class="absolute w-full h-full inset-0 bg-counterspell-100/95 z-50 hidden data-[error]:flex flex-col justify-center items-center gap-6" bind:this={errorElement}>
	<p class="text-lg text-white font-retro">{errorText}</p>
	<button class="bg-counterspell-pink py-4 px-12 font-retro text-white" on:click={() => errorElement.removeAttribute("data-error")}>OK</button>
</div>

{#if connectedStreamID}
	<iframe src={`/read-embed?streamID=${connectedStreamID}`} frameborder="0" class="absolute w-full h-full inset-0" title="Portal"></iframe>
	<!-- <iframe src={`//${import.meta.env.VITE_HLS_HOST}:${import.meta.env.VITE_HLS_PORT}/${connectedStreamID}`} frameborder="0" class="absolute w-full h-full inset-0" title="Portal"></iframe> -->
{/if}


{#if streamID}
	<!-- svelte-ignore a11y-media-has-caption -->
	<!-- <video autoplay bind:this={videoElement} class="absolute h-full w-full object-cover" /> -->
	<!-- <iframe src={`//${import.meta.env.VITE_WEBRTC_HOST}:${import.meta.env.VITE_WEBRTC_PORT}/${localId}/publish?audio-voice=false`} frameborder="0" class="absolute w-full h-full" title="Portal"></iframe> -->
	<iframe src={`/publish-embed?streamID=${streamID}`} frameborder="0" class="absolute w-full h-full inset-0" title="Portal"></iframe>
{/if}

<!-- 
{#if socket && !currentCall}
	<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-retro">1
		<p class="text-center text-counterspell-pink text-3xl mx-auto w-max">You'll be connected shortly...</p>
		<p class="text-center text-white text-xl opacity-70 mx-auto w-max">Currently connected events: {eventCount || "Thinking..."}</p>
	</div>
{/if} -->

{#if !firstConnect}
	<div
		class="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-2
				transition-transform ease-in-out data-[hidden]:scale-0"
		bind:this={controlsElement}
	>
		{#if eventRunning}
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
			<button class="bg-counterspell-pink p-4 font-retro text-white" on:click={handleReady}>SIGN IN</button>
		{:else}
			<!-- TODO: "event has ended, ty!" text here -->
		{/if}
	</div>
{/if}