function durationMillisecondsToString(millis: number): string {
	const hours = Math.floor(millis / 3600000);
	millis -= hours * 3600000;
	const minutes = Math.floor(millis / 60000);
	millis -= minutes * 60000;
	const seconds = Math.floor(millis / 1000);
	if (hours > 0) {
		return `${hours}:${minutes}:${seconds}`;
	}
	return `${minutes}:${seconds}`;
}

function noop() {}

export { durationMillisecondsToString, noop };
