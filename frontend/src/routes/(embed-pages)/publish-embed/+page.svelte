<script>
	// @ts-nocheck

	import { onMount } from 'svelte';

	// config vars
    let streamID;
    let publishURL;

	onMount(() => {
        streamID = (new URLSearchParams(window.location.search)).get("streamID");

		if (!streamID) {
			// only error if it's in an iframe-- otherwise it's for testing
			if (window.self !== window.top) {
				window.parent.postMessage({type: "error", data: "No streamID provided"}, "*");
				return;
			} else {
				streamID = "test";
			}
        }

        publishURL = `${window.location.protocol}//${import.meta.env.VITE_WEBRTC_HOST}:${import.meta.env.VITE_WEBRTC_PORT}/${streamID}/whip`;


		// MediaMTXWebRTCPublisher
		// ADAPTED FROM https://github.com/bluenviron/mediamtx/blob/main/internal/servers/webrtc/publisher.js

		(() => {
			const unquoteCredential = v => JSON.parse(`"${v}"`);

			const linkToIceServers = links =>
				links !== null
					? links.split(', ').map(link => {
							const m = link.match(
								/^<(.+?)>; rel="ice-server"(; username="(.*?)"; credential="(.*?)"; credential-type="password")?/i
							);
							const ret = {
								urls: [m[1]],
							};

							if (m[3] !== undefined) {
								ret.username = unquoteCredential(m[3]);
								ret.credential = unquoteCredential(m[4]);
								ret.credentialType = 'password';
							}

							return ret;
						})
					: [];

			const parseOffer = offer => {
				const ret = {
					iceUfrag: '',
					icePwd: '',
					medias: [],
				};

				for (const line of offer.split('\r\n')) {
					if (line.startsWith('m=')) {
						ret.medias.push(line.slice('m='.length));
					} else if (ret.iceUfrag === '' && line.startsWith('a=ice-ufrag:')) {
						ret.iceUfrag = line.slice('a=ice-ufrag:'.length);
					} else if (ret.icePwd === '' && line.startsWith('a=ice-pwd:')) {
						ret.icePwd = line.slice('a=ice-pwd:'.length);
					}
				}

				return ret;
			};

			const generateSdpFragment = (od, candidates) => {
				const candidatesByMedia = {};
				for (const candidate of candidates) {
					const mid = candidate.sdpMLineIndex;
					if (candidatesByMedia[mid] === undefined) {
						candidatesByMedia[mid] = [];
					}
					candidatesByMedia[mid].push(candidate);
				}

				let frag = 'a=ice-ufrag:' + od.iceUfrag + '\r\n' + 'a=ice-pwd:' + od.icePwd + '\r\n';

				let mid = 0;

				for (const media of od.medias) {
					if (candidatesByMedia[mid] !== undefined) {
						frag += 'm=' + media + '\r\n' + 'a=mid:' + mid + '\r\n';

						for (const candidate of candidatesByMedia[mid]) {
							frag += 'a=' + candidate.candidate + '\r\n';
						}
					}
					mid++;
				}

				return frag;
			};

			const setCodec = (section, codec) => {
				const lines = section.split('\r\n');
				const lines2 = [];
				const payloadFormats = [];

				for (const line of lines) {
					if (!line.startsWith('a=rtpmap:')) {
						lines2.push(line);
					} else {
						if (line.toLowerCase().includes(codec)) {
							payloadFormats.push(line.slice('a=rtpmap:'.length).split(' ')[0]);
							lines2.push(line);
						}
					}
				}

				const lines3 = [];
				let firstLine = true;

				for (const line of lines2) {
					if (firstLine) {
						firstLine = false;
						lines3.push(line.split(' ').slice(0, 3).concat(payloadFormats).join(' '));
					} else if (line.startsWith('a=fmtp:')) {
						if (payloadFormats.includes(line.slice('a=fmtp:'.length).split(' ')[0])) {
							lines3.push(line);
						}
					} else if (line.startsWith('a=rtcp-fb:')) {
						if (payloadFormats.includes(line.slice('a=rtcp-fb:'.length).split(' ')[0])) {
							lines3.push(line);
						}
					} else {
						lines3.push(line);
					}
				}

				return lines3.join('\r\n');
			};

			const setVideoBitrate = (section, bitrate) => {
				let lines = section.split('\r\n');

				for (let i = 0; i < lines.length; i++) {
					if (lines[i].startsWith('c=')) {
						lines = [
							...lines.slice(0, i + 1),
							'b=TIAS:' + (parseInt(bitrate) * 1024).toString(),
							...lines.slice(i + 1),
						];
						break;
					}
				}

				return lines.join('\r\n');
			};

			const setAudioBitrate = (section, bitrate, voice) => {
				let opusPayloadFormat = '';
				let lines = section.split('\r\n');

				for (let i = 0; i < lines.length; i++) {
					if (lines[i].startsWith('a=rtpmap:') && lines[i].toLowerCase().includes('opus/')) {
						opusPayloadFormat = lines[i].slice('a=rtpmap:'.length).split(' ')[0];
						break;
					}
				}

				if (opusPayloadFormat === '') {
					return section;
				}

				for (let i = 0; i < lines.length; i++) {
					if (lines[i].startsWith('a=fmtp:' + opusPayloadFormat + ' ')) {
						if (voice) {
							lines[i] =
								'a=fmtp:' +
								opusPayloadFormat +
								' minptime=10;useinbandfec=1;maxaveragebitrate=' +
								(parseInt(bitrate) * 1024).toString();
						} else {
							lines[i] =
								'a=fmtp:' +
								opusPayloadFormat +
								' maxplaybackrate=48000;stereo=1;sprop-stereo=1;maxaveragebitrate=' +
								(parseInt(bitrate) * 1024).toString();
						}
					}
				}

				return lines.join('\r\n');
			};

			const editOffer = (sdp, videoCodec, audioCodec, audioBitrate, audioVoice) => {
				const sections = sdp.split('m=');

				for (let i = 0; i < sections.length; i++) {
					if (sections[i].startsWith('video')) {
						sections[i] = setCodec(sections[i], videoCodec);
					} else if (sections[i].startsWith('audio')) {
						sections[i] = setAudioBitrate(
							setCodec(sections[i], audioCodec),
							audioBitrate,
							audioVoice
						);
					}
				}

				return sections.join('m=');
			};

			const editAnswer = (sdp, videoBitrate) => {
				const sections = sdp.split('m=');

				for (let i = 0; i < sections.length; i++) {
					if (sections[i].startsWith('video')) {
						sections[i] = setVideoBitrate(sections[i], videoBitrate);
					}
				}

				return sections.join('m=');
			};

			const retryPause = 2000;

			class MediaMTXWebRTCPublisher {
				constructor(conf) {
					this.conf = conf;
					this.state = 'initializing';
					this.restartTimeout = null;
					this.pc = null;
					this.offerData = null;
					this.sessionUrl = null;
					this.queuedCandidates = [];

					this.start();
				}

				start = () => {
					this.state = 'running';

					this.requestICEServers()
						.then(iceServers => this.setupPeerConnection(iceServers))
						.then(offer => this.sendOffer(offer))
						.then(answer => this.setAnswer(answer))
						.catch(err => {
							this.handleError(err.toString());
						});
				};

				handleError = err => {
					if (this.state === 'restarting' || this.state === 'error') {
						return;
					}

					if (this.pc !== null) {
						this.pc.close();
						this.pc = null;
					}

					this.offerData = null;

					if (this.sessionUrl !== null) {
						fetch(this.sessionUrl, {
							method: 'DELETE',
						});
						this.sessionUrl = null;
					}

					this.queuedCandidates = [];

					if (this.state === 'running') {
						this.state = 'restarting';

						this.restartTimeout = window.setTimeout(() => {
							this.restartTimeout = null;
							this.start();
						}, retryPause);

						if (this.conf.onError !== undefined) {
							this.conf.onError(err + ', retrying in some seconds');
						}
					} else {
						this.state = 'error';

						if (this.conf.onError !== undefined) {
							this.conf.onError(err);
						}
					}
				};

				requestICEServers = () => {
					return fetch(this.conf.url, {
						method: 'OPTIONS',
					}).then(res => linkToIceServers(res.headers.get('Link')));
				};

				setupPeerConnection = iceServers => {
					this.pc = new RTCPeerConnection({
						iceServers,
						// https://webrtc.org/getting-started/unified-plan-transition-guide
						sdpSemantics: 'unified-plan',
					});

					this.pc.onicecandidate = evt => this.onLocalCandidate(evt);
					this.pc.onconnectionstatechange = () => this.onConnectionState();

					this.conf.stream.getTracks().forEach(track => {
						this.pc.addTrack(track, this.conf.stream);
					});

					return this.pc.createOffer().then(offer => {
						this.offerData = parseOffer(offer.sdp);

						return this.pc.setLocalDescription(offer).then(() => offer.sdp);
					});
				};

				sendOffer = offer => {
					offer = editOffer(
						offer,
						this.conf.videoCodec,
						this.conf.audioCodec,
						this.conf.audioBitrate,
						this.conf.audioVoice
					);

					return fetch(this.conf.url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/sdp',
						},
						body: offer,
					}).then(res => {
						switch (res.status) {
							case 201:
								break;
							case 400:
								return res.json().then(e => {
									throw new Error(e.error);
								});
							default:
								throw new Error(`bad status code ${res.status}`);
						}

						this.sessionUrl = new URL(res.headers.get('location'), this.conf.url).toString();

						return res.text();
					});
				};

				setAnswer = answer => {
					if (this.state !== 'running') {
						return;
					}

					answer = editAnswer(answer, this.conf.videoBitrate);

					return this.pc
						.setRemoteDescription(
							new RTCSessionDescription({
								type: 'answer',
								sdp: answer,
							})
						)
						.then(() => {
							if (this.queuedCandidates.length !== 0) {
								this.sendLocalCandidates(this.queuedCandidates);
								this.queuedCandidates = [];
							}
						});
				};

				onLocalCandidate = evt => {
					if (this.state !== 'running') {
						return;
					}

					if (evt.candidate !== null) {
						if (this.sessionUrl === null) {
							this.queuedCandidates.push(evt.candidate);
						} else {
							this.sendLocalCandidates([evt.candidate]);
						}
					}
				};

				sendLocalCandidates = candidates => {
					fetch(this.sessionUrl, {
						method: 'PATCH',
						headers: {
							'Content-Type': 'application/trickle-ice-sdpfrag',
							'If-Match': '*',
						},
						body: generateSdpFragment(this.offerData, candidates),
					})
						.then(res => {
							switch (res.status) {
								case 204:
									break;
								case 404:
									throw new Error('stream not found');
								default:
									throw new Error(`bad status code ${res.status}`);
							}
						})
						.catch(err => {
							this.handleError(err.toString());
						});
				};

				onConnectionState = () => {
					if (this.state !== 'running') {
						return;
					}

					// "closed" can arrive before "failed" and without
					// the close() method being called at all.
					// It happens when the other peer sends a termination
					// message like a DTLS CloseNotify.
					if (this.pc.connectionState === 'failed' || this.pc.connectionState === 'closed') {
						this.handleError('peer connection closed');
					} else if (this.pc.connectionState === 'connected') {
						if (this.conf.onConnected !== undefined) {
							this.conf.onConnected();
						}
					}
				};
			}

			window.MediaMTXWebRTCPublisher = MediaMTXWebRTCPublisher;
		})();

		// END OF MediaMTXWebRTCPublisher

		// ADAPTED FROM https://github.com/bluenviron/mediamtx/blob/main/internal/servers/webrtc/publish_index.html

		const video = document.getElementById('video');
		const controls = document.getElementById('controls');
		const message = document.getElementById('message');
		const publishButton = document.getElementById('publish-button');

		const videoForm = {
			device: document.getElementById('video-device'),
			codec: document.getElementById('video-codec'),
			bitrate: document.getElementById('video-bitrate'),
			framerate: document.getElementById('video-framerate'),
			width: document.getElementById('video-width'),
			height: document.getElementById('video-height'),
		};

		const audioForm = {
			device: document.getElementById('audio-device'),
			codec: document.getElementById('audio-codec'),
			bitrate: document.getElementById('audio-bitrate'),
			voice: document.getElementById('audio-voice'),
		};

		const setMessage = str => {
			message.innerText = str;
		};

		const onStream = stream => {
            if (video) {
                video.srcObject = stream;
            }

			new MediaMTXWebRTCPublisher({
				url: publishURL + window.location.search,
				stream,
				videoCodec: videoForm.codec.value,
				videoBitrate: videoForm.bitrate.value,
				audioCodec: audioForm.codec.value,
				audioBitrate: audioForm.bitrate.value,
				audioVoice: audioForm.voice.checked,
				onError: err => {
					setMessage(err);
				},
				onConnected: evt => {
					setMessage('');
					window.parent.postMessage({ type: 'ready' }, '*');
				},
			});
		};

		const onPublish = () => {
			controls.style.display = 'none';
            if (video) {
                video.style.display = 'block';
            }
			setMessage('connecting');

			const videoId = videoForm.device.value;
			const audioId = audioForm.device.value;

			if (videoId !== 'screen') {
				let videoOpts = false;

				if (videoId !== 'none') {
					videoOpts = {
						deviceId: videoId,
						width: { ideal: videoForm.width.value },
						height: { ideal: videoForm.height.value },
						frameRate: { ideal: videoForm.framerate.value },
					};
				}

				let audioOpts = false;

				if (audioId !== 'none') {
					audioOpts = {
						deviceId: audioId,
					};

					const voice = audioForm.voice.checked;
					if (!voice) {
						audioOpts.autoGainControl = false;
						audioOpts.echoCancellation = false;
						audioOpts.noiseSuppression = false;
					}
				}

				navigator.mediaDevices
					.getUserMedia({
						video: videoOpts,
						audio: audioOpts,
					})
					.then(stream => onStream(stream))
					.catch(err => {
						setMessage(err.toString());
					});
			} else {
				navigator.mediaDevices
					.getDisplayMedia({
						video: {
							width: { ideal: videoForm.width.value },
							height: { ideal: videoForm.height.value },
							frameRate: { ideal: videoForm.framerate.value },
							cursor: 'always',
						},
						audio: true,
					})
					.then(stream => onStream(stream))
					.catch(err => {
						setMessage(err.toString());
					});
			}
		};

		const selectHasOption = (select, option) => {
			for (const opt of select.querySelectorAll('option')) {
				if (opt.value === option) {
					return true;
				}
			}
			return false;
		};

		const populateDevices = () => {
			return navigator.mediaDevices.enumerateDevices().then(devices => {
				for (const device of devices) {
					if (device.kind === 'videoinput' || device.kind === 'audioinput') {
						const select = device.kind === 'videoinput' ? videoForm.device : audioForm.device;

						if (!selectHasOption(select, device.deviceId)) {
							const opt = document.createElement('option');
							opt.value = device.deviceId;
							opt.text = device.label;
							select.appendChild(opt);
						}
					}
				}

				if (navigator.mediaDevices.getDisplayMedia !== undefined) {
					const opt = document.createElement('option');
					opt.value = 'screen';
					opt.text = 'screen';
					videoForm.device.appendChild(opt);
				}

				// set first available device as default device
				if (videoForm.device.children.length !== 0) {
					videoForm.device.value = videoForm.device.children[1].value;
				}

				// set first available device as default device
				if (audioForm.device.children.length !== 0) {
					audioForm.device.value = audioForm.device.children[1].value;
				}
			});
		};

		const populateCodecs = () => {
			const tempPC = new RTCPeerConnection({});
			tempPC.addTransceiver('video', { direction: 'sendonly' });
			tempPC.addTransceiver('audio', { direction: 'sendonly' });

			return tempPC.createOffer().then(desc => {
				const sdp = desc.sdp.toLowerCase();

				for (const codec of ['av1/90000', 'vp9/90000', 'vp8/90000', 'h264/90000', 'h265/90000']) {
					if (sdp.includes(codec)) {
						const opt = document.createElement('option');
						opt.value = codec;
						opt.text = codec.split('/')[0].toUpperCase();
						videoForm.codec.appendChild(opt);
					}
				}

				for (const codec of ['opus/48000', 'g722/8000', 'pcmu/8000', 'pcma/8000']) {
					if (sdp.includes(codec)) {
						const opt = document.createElement('option');
						opt.value = codec;
						opt.text = codec.split('/')[0].toUpperCase();
						audioForm.codec.appendChild(opt);
					}
				}

				tempPC.close();
			});
		};

		const populateOptions = () => {
			setMessage('loading devices');

			navigator.mediaDevices
				.getUserMedia({ video: true, audio: true })
				.then(tempStream => {
					return Promise.all([populateDevices(), populateCodecs()]).then(() => {
						// free the webcam to prevent 'NotReadableError' on Android
						tempStream.getTracks().forEach(track => track.stop());

						setMessage('');

						loadValuesFromQuery();
						setupEventListeners();

                        if (video) {
                            video.style.display = 'none';
                        }
						controls.style.display = 'flex';
					});
				})
				.catch(err => {
					setMessage(err.toString());
				});
		};

		const setupEventListeners = () => {
			const url = new URL(window.location.href);
			const inputs = [...Object.values(videoForm), ...Object.values(audioForm)];

			for (const input of inputs) {
				if (input instanceof HTMLInputElement && input.type === 'text') {
					input.addEventListener('input', () => {
						url.searchParams.set(input.id, input.value);
						window.history.replaceState(null, null, url);
					});
				}

				if (input instanceof HTMLInputElement && input.type === 'checkbox') {
					input.addEventListener('input', () => {
						url.searchParams.set(input.id, input.checked);
						window.history.replaceState(null, null, url);
					});
				}

				if (input instanceof HTMLSelectElement) {
					input.addEventListener('input', () => {
						url.searchParams.set(input.id, input.value);
						window.history.replaceState(null, null, url);
					});
				}
			}
		};

		const loadValuesFromQuery = () => {
			const params = new URLSearchParams(window.location.search);
			const inputs = [...Object.values(videoForm), ...Object.values(audioForm)];

			for (const input of inputs) {
				const value = params.get(input.id);
				if (value) {
					if (input instanceof HTMLInputElement && input.type === 'text') {
						input.value = value;
					} else if (input instanceof HTMLInputElement && input.type === 'checkbox') {
						input.checked = value === 'true';
					} else if (input instanceof HTMLSelectElement) {
						input.value = value;
					}
				}
			}
		};

		if (navigator.mediaDevices === undefined) {
			setMessage(
				`can't access webcams or microphones. Make sure that WebRTC encryption is enabled.`
			);
			return;
		}

		publishButton.addEventListener('click', onPublish);
		populateOptions();
	});
</script>

<div class="absolute left-0 top-0 h-full w-full z-10 font-moonblossom">
	<!-- this can be commented out with no issues -->
    <video id="video" muted autoplay playsinline class="absolute w-[30vw] left-0 bottom-0 bg-[url(/blue-scrap.png)] bg-center bg-no-repeat bg-contain p-[5vw]"></video>

	<div id="controls">
		<div id="items" class="w-1/2">
			<div class="item bg-counterspell-200 pl-5">
				<label for="video-device">Video&nbsp;Device</label>
				<select id="video-device" class="bg-counterspell-200 border-4 border-dashed border-counterspell-pink !p-3 !text-lg">
					<option value="none">none</option>
				</select>
			</div>

			<div class="item !hidden">
				<label for="video-codec">video codec</label>
				<select id="video-codec" class="bg-counterspell-100 border-4 border-dashed border-counterspell-pink !p-3 !text-lg"> </select>
			</div>

			<div class="item !hidden">
				<label for="video-bitrate">video bitrate (kbps)</label>
				<input id="video-bitrate" type="text" value="10000" class="bg-counterspell-100 border-4 border-dashed border-counterspell-pink !p-3 !text-lg" />
			</div>

			<div class="item !hidden">
				<label for="video-framerate">video framerate (ideal)</label>
				<input id="video-framerate" type="text" value="30" class="bg-counterspell-100 border-4 border-dashed border-counterspell-pink !p-3 !text-lg" />
			</div>

			<div class="item !hidden">
				<label for="video-width">video width (ideal)</label>
				<input id="video-width" type="text" value="1920" class="bg-counterspell-100 border-4 border-dashed border-counterspell-pink !p-3 !text-lg" />
			</div>

			<div class="item !hidden">
				<label for="video-height">video height (ideal)</label>
				<input id="video-height" type="text" value="1080" class="bg-counterspell-100 border-4 border-dashed border-counterspell-pink !p-3 !text-lg" />
			</div>

			<div class="item bg-counterspell-200 pl-5">
				<label for="audio-device">Audio&nbsp;Device</label>
				<select id="audio-device" class="bg-counterspell-200 border-4 border-dashed border-counterspell-pink !p-3 !text-lg">
					<option value="none">none</option>
				</select>
			</div>

			<div class="item !hidden">
				<label for="audio-codec">audio codec</label>
				<select id="audio-codec" class="bg-counterspell-100 border-4 border-dashed border-counterspell-pink !p-3 !text-lg"> </select>
			</div>

			<div class="item !hidden">
				<label for="audio-bitrate">audio bitrate (kbps)</label>
				<input id="audio-bitrate" type="text" value="1" class="bg-counterspell-100 border-4 border-dashed border-counterspell-pink !p-3 !text-lg" />
			</div>

			<div class="item !hidden">
				<label for="audio-voice">optimize for voice</label>
				<div>
					<input id="audio-voice" type="checkbox" class="bg-counterspell-100 border-4 border-dashed border-counterspell-pink !p-3 !text-lg" />
				</div>
			</div>
		</div>

		<div id="submit-line">
			<button class="!bg-counterspell-pink !p-4 !font-moonblossom !text-white" id="publish-button">ENTER THE PORTAL</button>
		</div>
	</div>

	<div id="message"></div>
</div>

<style>
	#controls {
		display: none;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		padding: 10px;
		flex-direction: column;
		min-height: 100%;
		width: 100%;
		color: white;
	}
	.item {
        display: flex;
        align-items: center;
		gap: 20px;
        width: 100%;
		margin: 10px 0;
	}
    .item label {
        flex-grow: 1;
    }
	select,
	input[type='text'] {
		appearance: none;
		color: inherit;
		padding: 0 10px;
        width: 30vw;
	}
	select option {
		color: black;
	}
	#message {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		text-align: center;
		justify-content: center;
		font-size: 16px;
		font-weight: bold;
		color: white;
		pointer-events: none;
		padding: 20px;
		text-shadow: 0 0 5px black;
	}
	#publish-button {
		margin-top: 10px;
		appearance: none;
		background: rgb(200, 200, 200);
		color: black;
		padding: 0 20px;
		border: none;
	}
</style>
