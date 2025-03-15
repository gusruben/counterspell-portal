<script lang="ts">
	import { Toaster } from 'svelte-sonner';
</script>

<Toaster toastOptions={{
	unstyled: true,
	classes: {
		toast: "bg-counterspell-100 rounded-none border-counterspell-pink border-4 border-dashed text-white font-moonblossom px-5 py-4"
	}
}}/>

<slot></slot>

<p class="absolute bottom-5 left-1/2 -translate-x-1/2 font-moonblossom text-white opacity-20 hover:opacity-50 text-sm transition-all">
	Made with ❤️ by <a class="underline" href="https://github.com/gusruben">Gus</a>, <a class="underline" href="https://github.com/TesDevelopment">Josh</a>, & <a class="underline" href="https://github.com/thedev132">Mohamad</a>
</p>
<div class="absolute w-full h-3/5 top-0 left-0 -z-50 bg-[url(/ripped-paper.png)] bg-contain bg-repeat-x"/>

<style>
:global(body) {
	background-color: #327d78;
	background-image: url(/cutting-mat.png);
	background-size: cover;
	background-repeat: no-repeat;
}
</style>