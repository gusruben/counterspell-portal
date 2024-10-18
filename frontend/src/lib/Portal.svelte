<script lang="ts">
    import { Peer, MediaConnection } from 'peerjs';
    import { v4 as uuidv4 } from "uuid";
    import { config as dotenv } from "dotenv";
	import { onMount } from 'svelte';

    dotenv();

    export let connectedLocation = "";
    export let timeLeft = 0;

    let videoElement: HTMLVideoElement;

    onMount(() => {

        const localId = uuidv4();
        console.log("Local ID:", localId);

        const peer = new Peer(localId, {
            host: process.env.HOST_SERVER,
            port: parseInt(process.env.HOST_PORT as string),
            path: "/",
        })

        // bro what
        // type script fuckery-- peer.socket._socket is private, but we use the existing
        // websocket connection to get notified for who to connect to / expect a call from 
        const socket = (peer.socket as unknown as {_socket: WebSocket})._socket;

        let trustedPeer: string | undefined;
        let currentCall: MediaConnection | undefined;
        socket.addEventListener("message", async event => {
            const ev = JSON.parse(event.data);

            switch(event.type) {
                case "call":
                    // if the server tells it to call a new peer, end any current call
                    if (currentCall) currentCall.close();

                    // call the new peer
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false});
                    currentCall = peer.call(ev.peer, stream);
                    currentCall.on("stream", remoteStream => videoElement.srcObject = remoteStream);
                break;

                case "assign":
                    trustedPeer = ev.peer;
                break;
            }
        })

        peer.on("call", async incomingCall  => {
            if (incomingCall.peer == trustedPeer) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false});
                incomingCall.answer(stream);
                incomingCall.on("stream", remoteStream => videoElement.srcObject = remoteStream);
            }
        })

    })
</script>

<!-- <div class="w-max h-max relative"> -->
    <!-- svelte-ignore a11y-media-has-caption -->
    <video autoplay bind:this={videoElement} class="absolute w-full h-full"/>
    <input type="text" class="font-retro text-lg p-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-countespell-pink border-dashed border-4 bg-counterspell-100">
<!-- </div> -->