<script lang="ts">
    export let URL: string;
    export let city: string;

    let element: HTMLDivElement;

    async function approve() {
        await fetch('/verdict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type: 'approve', URL }),
            credentials: "include",
        });
        
        element.style.display = "none";
    }

    async function reject() {
        await fetch('/verdict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type: 'reject', url: URL }),
            credentials: "include",
        });
        
        element.style.display = "none";
    }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div on:click bind:this={element} class="p-5 bg-[url(/dithering.png)] bg-cover hover:brightness-90 cursor-pointer" style="image-rendering: pixelated">
    <div class="bg-black bg-opacity-20 flex flex-col w-64 relative">
        {#if URL.endsWith("mp4")}
            <!-- svelte-ignore a11y-media-has-caption -->
            <video src={URL} class="w-full h-40"></video>
            <img src="/play.svg" alt="" class="h-10 w-10 p-2 absolute top-[6.5rem] right-2 bg-counterspell-100 bg-opacity-50">
        {:else}
            <img src={URL} alt="" class="w-full h-40">
        {/if}
        <p class="text-white font-retro text-lg p-3 w-full">{city}</p>
        <button class="text-white font-retro text-lg p-3 w-full hover:brightness-90 bg-counterspell-500 mb-1" on:click={approve}>Approve</button>
        <button class="text-white font-retro text-lg p-3 w-full hover:brightness-90 bg-counterspell-500" on:click={reject}>Reject</button>
    </div>
</div>