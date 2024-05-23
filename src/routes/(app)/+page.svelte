<script lang="ts">
	import { Button } from '$/components/ui/button';
	import { FFmpeg } from '@ffmpeg/ffmpeg';
	import { toBlobURL } from '@ffmpeg/util';
	import { onMount } from 'svelte';
	import { Input } from '$/components/ui/input/index.js';
	import { Label } from '$/components/ui/label/index.js';
	import * as _ from 'lodash-es';
	import * as Select from '$/components/ui/select';
	import { Progress } from '$/components/ui/progress/index.js';
	import ProgressBar from '$/components/ProgressBar.svelte';
	import { durationMillisecondsToString } from '$/utils';

	let ffmpeg: FFmpeg;
	let videoSrc: string = '';
	let videoDurationMillis: number = 0;
	let videoElement: HTMLVideoElement;
	let audioElement: HTMLAudioElement;
	let audioInputDevices: MediaDeviceInfo[] = [];
	let selectedAudioInputDevice: MediaDeviceInfo;
	let chunks: Blob[] = [];

	async function onFileChoose(event: InputEvent) {
		const inp = event.target as HTMLInputElement;
		const file = inp.files?.[0];
		if (!file) {
			alert('No file selected');
			return;
		}
		videoSrc = URL.createObjectURL(file);
	}

	async function load() {
		const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
		ffmpeg = new FFmpeg();
		ffmpeg.on('log', ({ message }) => {
			console.log(message);
		});
		// toBlobURL is used to bypass CORS issue, urls with the same
		// domain can be used directly.
		await ffmpeg.load({
			coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
			wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
		});
		audioInputDevices = (await navigator.mediaDevices.enumerateDevices()).filter(
			(d) => d.kind === 'audioinput'
		);
		selectedAudioInputDevice = audioInputDevices[0];
		console.log(audioInputDevices, selectedAudioInputDevice);
	}

	let recorder: MediaRecorder;
	let recorderState: MediaRecorder['state'];
	let mediaStream: MediaStream;
	async function toggleRecording() {
		mediaStream = await navigator.mediaDevices.getUserMedia({
			audio: { deviceId: selectedAudioInputDevice?.deviceId ?? 'default' }
		});
		if (!recorder) {
			recorder = new MediaRecorder(mediaStream);
			recorder.ondataavailable = async (e) => {
				chunks.push(e.data);
				const audioBlob = new Blob(chunks, { type: recorder.mimeType });
				// audioElement.src = URL.createObjectURL(audioBlob);
				const videoBlob = await fetch(videoElement.src).then((r) => r.blob());
				await ffmpeg.writeFile('input.webm', new Uint8Array(await audioBlob.arrayBuffer()));
				await ffmpeg.writeFile('input.mp4', new Uint8Array(await videoBlob.arrayBuffer()));
				await ffmpeg.exec(
					'-i input.webm -i input.mp4 -c:v copy -c:a aac -map 0:a -map 1:v output.mp4'.split(' ')
				);
				const data = await ffmpeg.readFile('output.mp4');
				videoSrc = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
			};
			recorder.onstop = () => {
				recorderState = 'inactive';
			};
			recorder.onstart = () => {
				recorderState = 'recording';
			};
		}
		switch (recorder.state) {
			case 'inactive':
				videoElement.play();
				videoElement.currentTime = 0;
				recorder.start();
				break;
			case 'paused':
				recorder.resume();
				break;
			case 'recording':
				videoElement.pause();
				videoElement.currentTime = 0;
				recorder.stop();
				break;
		}
	}

	let playing: boolean = false;
	async function togglePlayback() {
		if (playing) {
			videoElement.pause();
		} else {
			videoElement.play();
		}
	}

	onMount(async () => {
		await load();
	});

	let progress: number = 0;
</script>

{#if !videoSrc}
	<div class="grid w-full max-w-sm content-start items-center gap-1.5 p-4">
		<Label for="video">Choose a video file</Label>
		<Input id="video" type="file" on:input={onFileChoose} accept="video/*" />
	</div>
{:else}
	<div class="grid h-full max-h-full grid-rows-[1fr_auto_auto_auto] gap-4 p-4">
		<video
			bind:this={videoElement}
			class="h-full w-full overflow-hidden overflow-hidden rounded-lg bg-secondary object-contain"
			src={videoSrc}
			on:timeupdate={(e) => {
				progress = (e.currentTarget.currentTime / e.currentTarget.duration) * 100;
			}}
			on:durationchange={(e) => {
				videoDurationMillis = e.currentTarget.duration * 1000;
			}}
			on:play={() => (playing = true)}
			on:pause={() => (playing = false)}
		>
			<track kind="captions" />
		</video>

		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="grid grid-cols-[auto_1fr] items-center gap-2">
			<span class="font-mono text-xs font-bold"
				>{durationMillisecondsToString(
					(progress / 100) * videoDurationMillis
				)}/{durationMillisecondsToString(videoDurationMillis)}</span
			>
			<ProgressBar
				bind:progress
				onProgressChange={() => {
					videoElement.currentTime = (videoElement.duration * progress) / 100;
				}}
			/>
		</div>
		<!-- <audio class="w-full" controls bind:this={audioElement}></audio> -->
		<div class="grid grid-cols-[1fr_1fr_auto] gap-4">
			<Button on:click={toggleRecording}>{recorderState === 'recording' ? 'Stop' : 'Record'}</Button
			>
			<Button
				on:click={() => {
					const a = document.createElement('a');
					a.href = videoSrc;
					a.download = 'output.mp4';
					a.click();
				}}>Download</Button
			>
			<Button on:click={togglePlayback} class="text-lg" size="icon">
				{#if playing}
					<span class="i-mdi-pause" />
					<span class="sr-only">Pause</span>
				{:else}
					<span class="i-mdi-play" />
					<span class="sr-only">Pause</span>
				{/if}
			</Button>
		</div>
		<!-- <Select.Root -->
		<!-- 	portal={null} -->
		<!-- 	name="device" -->
		<!-- 	selected={selectedAudioInputDevice && { -->
		<!-- 		value: selectedAudioInputDevice, -->
		<!-- 		label: selectedAudioInputDevice.label -->
		<!-- 	}} -->
		<!-- 	onSelectedChange={(v) => { -->
		<!-- 		if (!v) return; -->
		<!-- 		selectedAudioInputDevice = v.value; -->
		<!-- 	}} -->
		<!-- > -->
		<!-- 	<Select.Trigger> -->
		<!-- 		<Select.Value placeholder="Select a mic" /> -->
		<!-- 	</Select.Trigger> -->
		<!-- 	<Select.Content> -->
		<!-- 		{#each audioInputDevices as device} -->
		<!-- 			<Select.Item value={device} label={device.label}>{device.label}</Select.Item> -->
		<!-- 		{/each} -->
		<!-- 	</Select.Content> -->
		<!-- </Select.Root> -->
	</div>
{/if}
