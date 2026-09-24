console.log("YTM Looper");

let loopInterval = null;
let loopStart = 0;
let loopEnd = 0;
let isLooping = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "startLoop") {
		startLoop(request.startTime, request.endTime);
	} else if (request.action === "stopLoop") {
		stopLoop();
	} else if (request.action === "getDuration") {
		const video = document.querySelector("video");
		if (video) {
			sendResponse({
				duration: video.duration,
				currentTime: video.currentTime,
				loopStart: loopStart,
				loopEnd: loopEnd,
				isLooping: isLooping,
			});
		} else {
			sendResponse({ error: "No video found" });
		}
	}
});

function startLoop(start, end) {
	const video = document.querySelector("video");
	if (!video) {
		console.error("No video element found");
		return;
	}

	loopStart = start;
	loopEnd = end;
	isLooping = true;

	// Clear any existing interval
	if (loopInterval) clearInterval(loopInterval);

	// Set video to start time immediately if it's past the end time or before start time
	if (
		video.currentTime < loopStart ||
		(loopEnd > 0 && video.currentTime > loopEnd)
	) {
		video.currentTime = loopStart;
	}

	// Check time frequently
	loopInterval = setInterval(() => {
		if (!isLooping) return;

		if (loopEnd > 0 && video.currentTime >= loopEnd) {
			video.currentTime = loopStart;
		}
	}, 100); // Check every 100ms

	console.log(`Loop started: ${loopStart}s - ${loopEnd}s`);
}

function stopLoop() {
	isLooping = false;
	if (loopInterval) {
		clearInterval(loopInterval);
		loopInterval = null;
	}
	console.log("Loop stopped");
}
