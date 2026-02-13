import logger from './logger.js';
import BlockingQueue from './BlockingQueue.js';
import { initOpusDecoder, initOpusEncoder } from './opus.js';
import { createStreamingContext } from './StreamingContext.js';

const SAMPLE_RATE = 16000;
const CHANNELS = 1;
// const FRAME_SIZE = 960;
const MIN_AUDIO_DURATION = 0.1;

export class VoiceConnection {
    constructor() {
        this.websocket = null;
        this.audioContext = null;
        this.audioQueue = new BlockingQueue();
        this.streamingContext = null;
        this.opusDecoder = null;
        this.opusEncoder = null;
        this.isConnected = false;
        this.sessionId = null;

        this.isRecording = false;
        this.audioProcessor = null;
        this.audioProcessorType = null;
        this.audioSource = null;
        this.analyser = null;
        this.gainNode = null;
        this.mediaStream = null;
        this.pcmDataBuffer = new Int16Array();
        this.audioBuffers = [];
        this.totalAudioSize = 0;
        this.audioWorkletRegistered = false;

        this.systemPrompt = null;

        this.onMessageCallback = null;
        this.onSttCallback = null;
        this.onTtsCallback = null;
        this.onConnectedCallback = null;
        this.onDisconnectedCallback = null;
    }

    validateConfig(config) {
        if (!config.deviceMac) {
            logger.error('设备MAC地址不能为空');
            return false;
        }
        if (!config.clientId) {
            logger.error('客户端ID不能为空');
            return false;
        }
        return true;
    }

    async connect(otaUrl, config) {
        if (!this.validateConfig(config)) {
            return false;
        }

        try {
            logger.info('正在连接到OTA服务器...');
            const otaResult = await this.sendOTA(otaUrl, config);

            if (!otaResult || !otaResult.websocket || !otaResult.websocket.url) {
                logger.error('OTA响应中缺少websocket信息');
                return false;
            }

            const { websocket } = otaResult;
            let connUrl = new URL(websocket.url);

            if (connUrl.hostname === '172.21.0.2' || connUrl.hostname.startsWith('172.')) {
                connUrl.hostname = '124.223.202.156';
                connUrl.port = '8002';
                logger.info('已将内网地址修正为公网地址: ' + connUrl.toString());
            }

            if (websocket.token) {
                const token = websocket.token.startsWith("Bearer ") ? websocket.token : 'Bearer ' + websocket.token;
                connUrl.searchParams.append('authorization', token);
            }

            connUrl.searchParams.append('device-id', config.deviceId);
            connUrl.searchParams.append('client-id', config.clientId);

            logger.info(`正在连接到WebSocket: ${connUrl.toString()}`);

            this.websocket = new WebSocket(connUrl.toString());
            this.websocket.binaryType = 'arraybuffer';

            return new Promise((resolve, reject) => {
                this.websocket.onopen = async () => {
                    logger.info('WebSocket连接成功');
                    this.isConnected = true;
                    await this.sendHello(config);
                    await this.initAudioSystem();
                    if (this.onConnectedCallback) {
                        this.onConnectedCallback();
                    }
                    resolve(true);
                };

                this.websocket.onclose = () => {
                    logger.info('WebSocket连接已关闭');
                    this.isConnected = false;
                    this.sessionId = null;
                    if (this.onDisconnectedCallback) {
                        this.onDisconnectedCallback();
                    }
                };

                this.websocket.onerror = (error) => {
                    logger.error(`WebSocket错误: ${error.message || '未知错误'}`);
                    reject(error);
                };

                this.websocket.onmessage = (event) => {
                    this.handleMessage(event);
                };

                setTimeout(() => {
                    if (!this.isConnected) {
                        reject(new Error('连接超时'));
                    }
                }, 5000);
            });
        } catch (error) {
            logger.error(`连接失败: ${error.message}`);
            return false;
        }
    }

    async sendOTA(otaUrl, config) {
        try {
            const res = await fetch(otaUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Device-Id': config.deviceId,
                    'Client-Id': config.clientId
                },
                body: JSON.stringify({
                    version: 0,
                    uuid: '',
                    application: {
                        name: 'parent-portal-web',
                        version: '1.0.0',
                        compile_time: new Date().toISOString(),
                        idf_version: '4.4.3',
                        elf_sha256: '1234567890abcdef'
                    },
                    ota: { label: 'parent-portal-web' },
                    board: {
                        type: 'web',
                        ssid: 'parent-portal',
                        rssi: 0,
                        channel: 0,
                        ip: '192.168.1.1',
                        mac: config.deviceMac
                    },
                    flash_size: 0,
                    minimum_free_heap_size: 0,
                    mac_address: config.deviceMac,
                    chip_model_name: 'web',
                    chip_info: { model: 0, cores: 0, revision: 0, features: 0 },
                    partition_table: [{ label: '', type: 0, subtype: 0, address: 0, size: 0 }]
                })
            });

            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

            const result = await res.json();
            logger.info('OTA请求成功');
            return result;
        } catch (err) {
            logger.error(`OTA请求失败: ${err.message}`);
            return null;
        }
    }

    async sendHello(config) {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return false;

        try {
            const helloMessage = {
                type: 'hello',
                device_id: config.deviceId,
                device_name: config.deviceName,
                device_mac: config.deviceMac,
                token: config.token,
                features: { mcp: true }
            };

            logger.info('发送hello握手消息');
            this.websocket.send(JSON.stringify(helloMessage));

            return new Promise(resolve => {
                const timeout = setTimeout(() => {
                    logger.error('等待hello响应超时');
                    resolve(false);
                }, 5000);

                const onMessageHandler = (event) => {
                    try {
                        if (typeof event.data === 'string') {
                            const response = JSON.parse(event.data);
                            if (response.type === 'hello' && response.session_id) {
                                this.sessionId = response.session_id;
                                logger.info(`服务器握手成功，会话ID: ${response.session_id}`);
                                clearTimeout(timeout);
                                this.websocket.removeEventListener('message', onMessageHandler);
                                resolve(true);
                            }
                        }
                    } catch (e) { }
                };

                this.websocket.addEventListener('message', onMessageHandler);
            });
        } catch (error) {
            logger.error(`发送hello消息错误: ${error.message}`);
            return false;
        }
    }

    async initAudioSystem() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: SAMPLE_RATE,
                latencyHint: 'interactive'
            });
            logger.info('音频上下文创建成功，采样率: ' + SAMPLE_RATE + 'Hz');

            this.opusDecoder = await initOpusDecoder();
            if (!this.opusDecoder) throw new Error('Opus解码器初始化失败');

            this.opusEncoder = initOpusEncoder();
            if (!this.opusEncoder) throw new Error('Opus编码器初始化失败');

            this.streamingContext = createStreamingContext(
                this.opusDecoder,
                this.audioContext,
                SAMPLE_RATE,
                CHANNELS,
                MIN_AUDIO_DURATION
            );

            this.startAudioBuffering();
            this.streamingContext.decodeOpusFrames();
            this.streamingContext.startPlaying();

            logger.info('音频系统初始化完成');
            return true;
        } catch (error) {
            logger.error(`音频系统初始化失败: ${error.message}`);
            return false;
        }
    }

    async startAudioBuffering() {
        logger.info("开始音频缓冲...");
        const timeout = 300;

        while (this.isConnected) {
            try {
                const packets = await this.audioQueue.dequeue(
                    3,
                    timeout,
                    (count) => {
                        logger.info(`缓冲超时，当前缓冲包数: ${count}，开始播放`);
                    }
                );

                if (packets.length) {
                    logger.info(`已缓冲 ${packets.length} 个音频包，开始播放`);
                    this.streamingContext.pushAudioBuffer(packets);
                }

                while (this.isConnected) {
                    const data = await this.audioQueue.dequeue(99, 50);
                    if (data && data.length) {
                        this.streamingContext.pushAudioBuffer(data);
                    } else {
                        break;
                    }
                }
            } catch (e) {
                break;
            }
        }
    }

    handleMessage(event) {
        try {
            if (typeof event.data === 'string') {
                const message = JSON.parse(event.data);
                logger.debug(`收到消息: ${message.type}`);

                if (message.type === 'tts') {
                    if (this.onTtsCallback) this.onTtsCallback(message);
                } else if (message.type === 'stt') {
                    logger.info(`STT 识别结果: ${message.text}`);
                    if (this.onSttCallback) this.onSttCallback(message.text);
                } else if (message.type === 'llm') {
                    logger.info(`LLM 文本片段: "${message.text}"`);
                    if (this.onMessageCallback && message.text) this.onMessageCallback(message.text);
                } else if (message.type === 'mcp') {
                    this.handleMcpMessage(message);
                }
            } else {
                this.handleBinaryMessage(event.data);
            }
        } catch (error) {
            logger.error(`消息处理错误: ${error.message}`);
        }
    }

    handleBinaryMessage(data) {
        try {
            let arrayBuffer;
            if (data instanceof ArrayBuffer) {
                arrayBuffer = data;
            } else {
                return;
            }

            const opusData = new Uint8Array(arrayBuffer);
            if (opusData.length > 0) {
                this.audioQueue.enqueue(opusData);
                logger.debug(`收到音频数据: ${opusData.length}字节`);
            }
        } catch (error) {
            logger.error(`处理二进制消息出错: ${error.message}`);
        }
    }

    handleMcpMessage(message) {
        const payload = message.payload || {};
        if (payload.method === 'tools/list') {
            const replayMessage = {
                "session_id": this.sessionId || "",
                "type": "mcp",
                "payload": {
                    "jsonrpc": "2.0",
                    "id": payload.id || 2,
                    "result": { "tools": [] }
                }
            };
            this.websocket.send(JSON.stringify(replayMessage));
        } else if (payload.method === 'tools/call') {
            const replayMessage = {
                "session_id": this.sessionId || "",
                "type": "mcp",
                "payload": {
                    "jsonrpc": "2.0",
                    "id": payload.id,
                    "result": {
                        "content": [{ "type": "text", "text": "true" }],
                        "isError": false
                    }
                }
            };
            this.websocket.send(JSON.stringify(replayMessage));
        }
    }

    async startRecording() {
        if (this.isRecording) return false;
        try {
            logger.info('开始录音...');
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('您的浏览器不支持录音功能');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            }).catch(() => navigator.mediaDevices.getUserMedia({ audio: true }));

            this.mediaStream = stream;
            const processorResult = await this.createAudioProcessor();
            if (!processorResult) return false;

            this.audioProcessor = processorResult.node;
            this.audioProcessorType = processorResult.type;

            this.audioSource = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 0;

            this.audioSource.connect(this.analyser);
            this.audioSource.connect(this.audioProcessor);
            this.audioProcessor.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);

            this.pcmDataBuffer = new Int16Array();
            this.audioBuffers = [];
            this.totalAudioSize = 0;
            this.isRecording = true;

            if (this.audioProcessorType === 'worklet' && this.audioProcessor.port) {
                this.audioProcessor.port.postMessage({ command: 'start' });
            }

            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                const listenMessage = {
                    type: 'listen',
                    mode: 'manual',
                    state: 'start',
                    system_prompt: this.systemPrompt || null
                };
                this.websocket.send(JSON.stringify(listenMessage));
            }
            return true;
        } catch (error) {
            logger.error(`录音启动失败: ${error.message}`);
            this.isRecording = false;
            throw error;
        }
    }

    async stopRecording() {
        if (!this.isRecording) return false;
        try {
            logger.info('停止录音...');
            this.isRecording = false;

            if (this.audioProcessor) {
                if (this.audioProcessorType === 'worklet' && this.audioProcessor.port) {
                    this.audioProcessor.port.postMessage({ command: 'stop' });
                }
                this.audioProcessor.disconnect();
                this.audioProcessor = null;
            }
            if (this.audioSource) this.audioSource.disconnect();
            if (this.analyser) this.analyser.disconnect();
            if (this.gainNode) this.gainNode.disconnect();

            this.stopMediaStream();
            this.encodeAndSendOpus();

            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(new Uint8Array(0));
                this.websocket.send(JSON.stringify({ type: 'listen', mode: 'manual', state: 'stop' }));
            }
            return true;
        } catch (error) {
            logger.error(`停止录音失败: ${error.message}`);
            return false;
        }
    }

    stopMediaStream() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
    }

    async createAudioProcessor() {
        try {
            if (this.audioContext.audioWorklet) {
                if (!this.audioWorkletRegistered) {
                    const audioProcessorCode = `
                        class AudioRecorderProcessor extends AudioWorkletProcessor {
                            constructor() {
                                super();
                                this.buffer = new Int16Array(960);
                                this.bufferIndex = 0;
                                this.isRecording = false;
                                this.port.onmessage = (event) => {
                                    if (event.data.command === 'start') this.isRecording = true;
                                    else if (event.data.command === 'stop') {
                                        this.isRecording = false;
                                        if (this.bufferIndex > 0) {
                                            this.port.postMessage({ type: 'buffer', buffer: this.buffer.slice(0, this.bufferIndex) });
                                            this.bufferIndex = 0;
                                        }
                                    }
                                };
                            }
                            process(inputs) {
                                if (!this.isRecording) return true;
                                const input = inputs[0];
                                if (!input || !input[0]) return true;
                                const channel = input[0];
                                for (let i = 0; i < channel.length; i++) {
                                    if (this.bufferIndex >= 960) {
                                        this.port.postMessage({ type: 'buffer', buffer: this.buffer.slice(0) });
                                        this.bufferIndex = 0;
                                    }
                                    this.buffer[this.bufferIndex++] = Math.max(-32768, Math.min(32767, Math.floor(channel[i] * 32767)));
                                }
                                return true;
                            }
                        }
                        registerProcessor('audio-recorder-processor', AudioRecorderProcessor);
                    `;
                    const blob = new Blob([audioProcessorCode], { type: 'application/javascript' });
                    const url = URL.createObjectURL(blob);
                    try {
                        await this.audioContext.audioWorklet.addModule(url);
                        this.audioWorkletRegistered = true;
                    } catch (error) {
                        if (!(error.name === 'NotSupportedError' && error.message.includes('already registered'))) throw error;
                    } finally { URL.revokeObjectURL(url); }
                }
                const audioProcessor = new AudioWorkletNode(this.audioContext, 'audio-recorder-processor');
                audioProcessor.port.onmessage = (event) => {
                    if (event.data.type === 'buffer') this.processPCMBuffer(event.data.buffer);
                };
                return { node: audioProcessor, type: 'worklet' };
            }
        } catch (error) { logger.warn(`创建音频处理器失败: ${error.message}`); }
        return null;
    }

    processPCMBuffer(buffer) {
        if (!this.isRecording) return;
        const newBuffer = new Int16Array(this.pcmDataBuffer.length + buffer.length);
        newBuffer.set(this.pcmDataBuffer);
        newBuffer.set(buffer, this.pcmDataBuffer.length);
        this.pcmDataBuffer = newBuffer;

        const samplesPerFrame = 960;
        while (this.pcmDataBuffer.length >= samplesPerFrame) {
            const frameData = this.pcmDataBuffer.slice(0, samplesPerFrame);
            this.pcmDataBuffer = this.pcmDataBuffer.slice(samplesPerFrame);
            this.encodeAndSendOpus(frameData);
        }
    }

    encodeAndSendOpus(pcmData = null) {
        if (!this.opusEncoder) return;
        try {
            if (pcmData) {
                const opusData = this.opusEncoder.encode(pcmData);
                if (opusData && opusData.length > 0) {
                    this.audioBuffers.push(opusData.buffer);
                    this.totalAudioSize += opusData.length;
                    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                        this.websocket.send(opusData.buffer);
                    }
                }
            } else if (this.pcmDataBuffer.length > 0) {
                const samplesPerFrame = 960;
                const paddedBuffer = new Int16Array(samplesPerFrame);
                paddedBuffer.set(this.pcmDataBuffer);
                this.encodeAndSendOpus(paddedBuffer);
                this.pcmDataBuffer = new Int16Array(0);
            }
        } catch (error) { logger.error(`Opus编码错误: ${error.message}`); }
    }

    disconnect() {
        if (this.isRecording) this.stopRecording();
        this.stopMediaStream();
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        this.isConnected = false;
        this.sessionId = null;
        logger.info('已断开连接');
    }

    onMessage(cb) { this.onMessageCallback = cb; }
    onStt(cb) { this.onSttCallback = cb; }
    onTts(cb) { this.onTtsCallback = cb; }
    onConnected(cb) { this.onConnectedCallback = cb; }
    onDisconnected(cb) { this.onDisconnectedCallback = cb; }
    setSystemPrompt(p) { this.systemPrompt = p; }

    static generateRandomMac() {
        const hex = '0123456789ABCDEF';
        let mac = '';
        for (let i = 0; i < 6; i++) {
            if (i > 0) mac += ':';
            mac += hex[Math.floor(Math.random() * 16)] + hex[Math.floor(Math.random() * 16)];
        }
        return mac;
    }
}

export default VoiceConnection;
