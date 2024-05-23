<script lang="ts">
	import Nav from '$/components/Nav.svelte';
	import { ModeWatcher } from 'mode-watcher';
</script>

<ModeWatcher />
<Nav class="px-4" />
<slot />
