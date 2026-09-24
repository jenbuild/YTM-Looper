document.addEventListener("DOMContentLoaded", async () => {
	const startBtn = document.getElementById("startLoop");
	const stopBtn = document.getElementById("stopLoop");
	const statusDiv = document.getElementById("status");
	const loadingDiv = document.getElementById("loading");
	const mainContent = document.querySelector(".main-container");

	const slider = document.getElementById("slider");
	const thumbStart = document.getElementById("thumbStart");
	const thumbEnd = document.getElementById("thumbEnd");
	const sliderRange = document.getElementById("sliderRange");
	const startTimeLabel = document.getElementById("startTimeLabel");
	const endTimeLabel = document.getElementById("endTimeLabel");

	let songDuration = 0;
	let startPercent = 0;
	let endPercent = 100;

	function formatTime(seconds) {
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, "0")}`;
	}

	function updateUI() {
		thumbStart.style.left = `${startPercent}%`;
		thumbEnd.style.left = `${endPercent}%`;
		sliderRange.style.left = `${startPercent}%`;
		sliderRange.style.width = `${endPercent - startPercent}%`;

		const startTime = (startPercent / 100) * songDuration;
		const endTime = (endPercent / 100) * songDuration;

		startTimeLabel.textContent = formatTime(startTime);
		endTimeLabel.textContent = formatTime(endTime);
	}

	function showStatus(msg, type = "info") {
		statusDiv.textContent = msg;
		statusDiv.style.color = type === "error" ? "#ef4444" : "#a1a1aa";
		setTimeout(() => {
			statusDiv.textContent = "";
		}, 3000);
	}

	// Initialize
	try {
		const [tab] = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		if (!tab) throw new Error("No active tab");

		const response = await chrome.tabs.sendMessage(tab.id, {
			action: "getDuration",
		});

		if (response && response.duration) {
			songDuration = response.duration;
			stopBtn.disabled = !response.isLooping;

			// Restore loop state if active
			if (response.isLooping && response.loopEnd > 0) {
				startPercent = (response.loopStart / songDuration) * 100;
				endPercent = (response.loopEnd / songDuration) * 100;
			}

			loadingDiv.style.display = "none";
			mainContent.style.display = "block";
			updateUI();
		} else {
			loadingDiv.textContent = "No music playing or not on YouTube Music";
		}
	} catch (err) {
		// console.error(err);
		loadingDiv.textContent =
			"Error connecting to page. Refresh and try again.";
	}

	// Slider Logic
	function handleDrag(thumb, isStart) {
		return (e) => {
			e.preventDefault();
			const sliderRect = slider.getBoundingClientRect();

			function onMouseMove(e) {
				let newPercent =
					((e.clientX - sliderRect.left) / sliderRect.width) * 100;
				newPercent = Math.max(0, Math.min(100, newPercent));

				if (isStart) {
					startPercent = Math.min(newPercent, endPercent - 1); // Keep 1% gap
				} else {
					endPercent = Math.max(newPercent, startPercent + 1);
				}
				updateUI();
			}

			function onMouseUp() {
				document.removeEventListener("mousemove", onMouseMove);
				document.removeEventListener("mouseup", onMouseUp);
			}

			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("mouseup", onMouseUp);
		};
	}

	thumbStart.addEventListener("mousedown", handleDrag(thumbStart, true));
	thumbEnd.addEventListener("mousedown", handleDrag(thumbEnd, false));

	// Buttons
	startBtn.addEventListener("click", async () => {
		const startTime = (startPercent / 100) * songDuration;
		const endTime = (endPercent / 100) * songDuration;

		try {
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});
			await chrome.tabs.sendMessage(tab.id, {
				action: "startLoop",
				startTime,
				endTime,
			});
			statusDiv.style.display = "block";
		} catch (err) {
			statusDiv.style.display = "none";
		}
	});

	stopBtn.addEventListener("click", async () => {
		try {
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});
			await chrome.tabs.sendMessage(tab.id, { action: "stopLoop" });
			statusDiv.style.display = "none";
		} catch (err) {
			console.error(err);
		}
	});
});
