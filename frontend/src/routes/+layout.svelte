<script lang="ts">
	import { Toaster } from 'svelte-sonner';
	import '../app.css';
</script>

<Toaster toastOptions={{
	unstyled: true,
	classes: {
		toast: "bg-[#0A081E] rounded-none border-counterspell-pink border-4 border-dashed text-white font-retro px-5 py-4"
	}
}}/>

<slot></slot>

<p class="absolute bottom-5 left-1/2 -translate-x-1/2 font-retro text-white opacity-20 hover:opacity-50 text-sm transition-all">
	Made with ❤️ by <a class="underline" href="https://github.com/gusruben">Gus</a>, <a class="underline" href="https://github.com/TesDevelopment">Josh</a>, & <a class="underline" href="https://github.com/thedev132">Mohamad</a>
</p>
<img src="/city.png" alt="City Background" class="absolute w-full h-2/5 bottom-0 left-0 -z-50 object-cover" style="image-rendering: pixelated"/>

<style>
:global(body) {
	background-color: #202f53;
}
</style>