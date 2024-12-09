<script lang="ts">
	import ReviewGalleryCard from "$lib/ReviewGalleryCard.svelte";
	import { onMount } from "svelte";

    let imageModalOpen = false;
    let currentMemoryIndex = -1;
    let memoriesToReview: {URL: string, city: string}[] = [];

    function viewImage(index: number) {
        console.log("viewing", index);
        imageModalOpen = true;
        currentMemoryIndex = index;
    }

    function openImageModal(e: MouseEvent, index: number) {
        if ((e.target as HTMLElement).tagName != "BUTTON") viewImage(index);
    }

    onMount(async () => {
        memoriesToReview = await (await fetch("/memories?review")).json();
    });
</script>

<div class="fixed inset-0 flex flex-col items-center gap-10 px-14 py-10 overflow-y-scroll">
	<div class="flex flex-row items-center w-full">
		<img src="/favicon.png" alt="Counterspell Portal Logo" class="w-14 h-14" />
		<h1 class=" font-retro text-3xl text-white">Review</h1>
</div>
    <div class="flex flex-row flex-wrap gap-5 px-16 pt-5 w-full">
        {#each memoriesToReview as memory, index}
            <ReviewGalleryCard URL={memory.URL} city={memory.city} on:click={e => openImageModal(e, index)}/>
        {/each}
    </div>
</div>

{#if imageModalOpen}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="absolute z-50 w-full h-full inset-0 bg-counterspell-100 bg-opacity-50" on:click={e => {if (e.target == e.currentTarget) imageModalOpen = false}}>
        <!-- svelte-ignore a11y-missing-attribute -->
        {#if memoriesToReview[currentMemoryIndex].URL.endsWith("mp4")}
            <!-- svelte-ignore a11y-media-has-caption -->
            <video autoplay controls src={memoriesToReview[currentMemoryIndex].URL} class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[60%] max-w-[80%]"></video>
        {:else}
            <img src={memoriesToReview[currentMemoryIndex].URL} alt="" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[60%] max-w-[80%]">
        {/if}
    </div>
{/if}

<svelte:head>
    <title>Review - Counterspell Portal</title>
</svelte:head>