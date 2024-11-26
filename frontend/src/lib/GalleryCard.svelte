<script lang="ts">
    export let URL: string;
    export let city: string;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div on:click class="p-5 bg-[url(/dithering.png)] bg-cover hover:brightness-90 cursor-pointer" style="image-rendering: pixelated">
    <div class="bg-black bg-opacity-20 flex flex-col w-64 relative">
        {#if URL.endsWith("mp4")}
            <!-- svelte-ignore a11y-media-has-caption -->
            <video src={URL} class="w-full h-40"></video>
            <img src="/play.svg" alt="" class="h-10 w-10 p-2 absolute top-[6.5rem] right-2 bg-counterspell-100 bg-opacity-50">
        {:else}
            <img src={URL} alt="" class="w-full h-40">
        {/if}
        <p class="text-white font-retro text-lg p-3 w-full">{city}</p>
    </div>
</div>