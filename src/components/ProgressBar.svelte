<script lang="ts">
	import { DragGesture } from '@use-gesture/vanilla';
	import * as _ from 'lodash-es';
	import { noop } from '$/utils';
	import { onMount } from 'svelte';

	export let progress: number;
	export let onProgressChange: (progress: number) => void = noop;
	let el: HTMLElement;

	onMount(() => {
		const gesture = new DragGesture(el, ({ xy: [x, y] }) => {
			const { left, right } = el.getBoundingClientRect();
			progress = Math.max(0, Math.min(1, (x - left) / (right - left))) * 100;
			onProgressChange(progress);
		});
		return () => gesture.destroy();
	});
</script>

<div bind:this={el} class="w-full touch-none overflow-hidden rounded-full bg-secondary">
	<div
		class="h-2 w-full origin-left bg-accent-foreground"
		style={`transform: scaleX(${progress}%)`}
	></div>
</div>
