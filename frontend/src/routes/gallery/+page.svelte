<script lang="ts">
	import GalleryCard from "$lib/GalleryCard.svelte";
	import { cities } from '$lib';
	import { toast } from "svelte-sonner";
	import { onMount } from "svelte";

    let memoryLinkInput: HTMLTextAreaElement;
    let cityInput: HTMLSelectElement;
    let authKeyInput: HTMLInputElement;
    let memories: {URL: string, city: string}[] = [];

    let submitModalOpen = false;
    let imageModalOpen = false;

    let currentMemoryIndex = -1;

    async function submitMemory() {
        let missingInput = false;
        for (let elem of [memoryLinkInput, cityInput, authKeyInput]) {
            if (!elem.value) {
                elem.setAttribute("data-error", "true");
                missingInput = true;
                toast("Please fill out all the fields!")
            }
        }
        if (missingInput) return;

        try {
            for (let URL of memoryLinkInput.value.split("\n")) {
                if (!URL) continue;
                    const res = await fetch("/memories", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            URL,
                            city: cityInput.value,
                            authKey: authKeyInput.value
                        })
                    });

                    if (res.status == 403) {
                        throw new Error("Invalid auth key!");
                    }
                    if (res.status !== 200) {
                        throw new Error(res.statusText);
                    }
                }
            
            toast("Memory submitted successfully!");
        } catch (error: any) {
            toast("Error submitting memory: " + error.message);
            console.error("Error submitting memory:", error);
        }
    }

    function viewImage(index: number) {
        console.log("viewing", index)
        imageModalOpen = true;
        submitModalOpen = false;
        currentMemoryIndex = index;
    }

    function openImageModal(e: MouseEvent, index: number) {
        if ((e.target as HTMLElement).tagName != "BUTTON") viewImage(index);
    }

    onMount(async () => {
        memories = await (await fetch("/memories")).json();
    });
</script>

<div class="fixed inset-0 flex flex-col items-center gap-10 px-14 py-10 overflow-y-scroll">
	<div class="flex flex-row items-center w-full">
		<img src="/favicon.png" alt="Counterspell Portal Logo" class="w-14 h-14" />
		<h1 class=" font-retro text-3xl text-white">Gallery</h1>
        <div class="flex-grow" />
        <button class="text-white font-retro text-xl bg-counterspell-pink p-3 hover:brightness-90" on:click={() => submitModalOpen = true}>Upload a Memory</button>
	</div>
    <div class="flex flex-row flex-wrap gap-5 px-16 pt-5 w-full">
        {#each memories as memory, index}
            <GalleryCard URL={memory.URL} city={memory.city} on:click={e => openImageModal(e, index)}/>
        {/each}
    </div>
</div>

{#if submitModalOpen}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="absolute z-50 w-full h-full inset-0 bg-counterspell-100 bg-opacity-50" on:click={e => {if (e.target == e.currentTarget) submitModalOpen = false}}>
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-counterspell-200
                    border-dashed border-4 border-counterspell-pink flex flex-col justify-center p-5 gap-3">
            <div class="mb-2 flex flex-row">
                <p class="text-2xl text-white font-retro">Upload a Memory</p>
                <div class="flex-grow" />
                <button class="text-2xl font-retro text-white px-2" on:click={() => submitModalOpen = false}>×</button>
            </div>
            <textarea bind:this={memoryLinkInput} placeholder="Image/Video Links, One Per Line" class="bg-counterspell-100 p-3 text-white font-retro text-lg
                                outline-none focus-visible:outline-2 focus-visible:outline-counterspell-pink
                                data-[error]:outline-2 data-[error]:outline-counterspell-pink" />
            <p class="text-white font-retro text-sm -mt-2 opacity-25">Upload your files to #cdn and paste the link here!</p>

            <select
                class="bg-counterspell-100 p-3 font-retro text-lg text-white outline-none focus-visible:outline-2
                focus-visible:outline-counterspell-pink data-[error]:outline-2 data-[error]:outline-counterspell-pink"
                bind:this={cityInput}
            >
                <option value="" disabled selected>Select your event city...</option>
                {#each cities as city}
                    <option value={city}>{city}</option>
                {/each}
            </select>
            <input bind:this={authKeyInput} type="password" placeholder="Auth key from your event" class="bg-counterspell-100 p-3 text-white font-retro
            text-lg outline-none focus-visible:outline-2 focus-visible:outline-counterspell-pink data-[error]:outline-2 data-[error]:outline-counterspell-pink">
            
            <button class="bg-counterspell-pink p-4 font-retro text-white" on:click={submitMemory}
                >Submit</button
            >
            <p class="text-white font-retro text-sm -mt-1 opacity-25">All submissions are reviewed!</p>
        </div>
    </div>
{/if}

{#if imageModalOpen}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="absolute z-50 w-full h-full inset-0 bg-counterspell-100 bg-opacity-50" on:click={e => {if (e.target == e.currentTarget) imageModalOpen = false}}>
        <!-- svelte-ignore a11y-missing-attribute -->
        {#if memories[currentMemoryIndex].URL.endsWith("mp4")}
            <!-- svelte-ignore a11y-media-has-caption -->
            <video autoplay controls src={memories[currentMemoryIndex].URL} class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[60%] max-w-[80%]"></video>
        {:else}
            <img src={memories[currentMemoryIndex].URL} alt="" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[60%] max-w-[80%]">
        {/if}
    </div>
{/if}

<svelte:head>
    <title>Gallery - Counterspell Portal</title>
</svelte:head>