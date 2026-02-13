import BlockingQueue from './BlockingQueue.js';
import logger from './logger.js';

export class StreamingContext {
    constructor(opusDecoder, audioContext, sampleRate, channels, minAudioDuration) {
        this.opusDecoder = opusDecoder;
        this.audioContext = audioContext;

        this.sampleRate = sampleRate;
        this.channels = channels;
        this.minAudioDuration = minAudioDuration;

        this.queue = [];
        this.activeQueue = new BlockingQueue();
        this.pendingAudioBufferQueue = [];
        this.audioBufferQueue = new BlockingQueue();
        this.playing = false;
        this.endOfStream = false;
        this.source = null;
        this.totalSamples = 0;
        this.lastPlayTime = 0;
    }

    pushAudioBuffer(item) {
        this.audioBufferQueue.enqueue(...item);
    }

    async getPendingAudioBufferQueue() {
        [this.pendingAudioBufferQueue, this.audioBufferQueue] = [await this.audioBufferQueue.dequeue(), new BlockingQueue()];
    }

    async getQueue(minSamples) {
        let TepArray = [];
        const num = minSamples - this.queue.length > 0 ? minSamples - this.queue.length : 1;

        [TepArray, this.activeQueue] = [await this.activeQueue.dequeue(num), new BlockingQueue()];
        this.queue.push(...TepArray);
    }

    convertInt16ToFloat32(int16Data) {
        const float32Data = new Float32Array(int16Data.length);
        for (let i = 0; i < int16Data.length; i++) {
            float32Data[i] = int16Data[i] / (int16Data[i] < 0 ? 0x8000 : 0x7FFF);
        }
        return float32Data;
    }

    async decodeOpusFrames() {
        if (!this.opusDecoder) {
            logger.error('Opus解码器未初始化，无法解码');
            return;
        } else {
            logger.info('Opus解码器启动');
        }

        while (true) {
            let decodedSamples = [];
            for (const frame of this.pendingAudioBufferQueue) {
                try {
                    const frameData = this.opusDecoder.decode(frame);
                    if (frameData && frameData.length > 0) {
                        const floatData = this.convertInt16ToFloat32(frameData);
                        for (let i = 0; i < floatData.length; i++) {
                            decodedSamples.push(floatData[i]);
                        }
                    }
                } catch (error) {
                    logger.error("Opus解码失败: " + error.message);
                }
            }

            if (decodedSamples.length > 0) {
                for (let i = 0; i < decodedSamples.length; i++) {
                    this.activeQueue.enqueue(decodedSamples[i]);
                }
                this.totalSamples += decodedSamples.length;
            }
            await this.getPendingAudioBufferQueue();
        }
    }

    async startPlaying() {
        while (true) {
            const minSamples = this.sampleRate * this.minAudioDuration * 3;
            if (!this.playing && this.queue.length < minSamples) {
                await this.getQueue(minSamples);
            }
            this.playing = true;
            while (this.playing && this.queue.length) {
                const minPlaySamples = Math.min(this.queue.length, this.sampleRate);
                const currentSamples = this.queue.splice(0, minPlaySamples);

                const audioBuffer = this.audioContext.createBuffer(this.channels, currentSamples.length, this.sampleRate);
                audioBuffer.copyToChannel(new Float32Array(currentSamples), 0);

                this.source = this.audioContext.createBufferSource();
                this.source.buffer = audioBuffer;

                const gainNode = this.audioContext.createGain();

                const fadeDuration = 0.02;
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + fadeDuration);

                const duration = audioBuffer.duration;
                if (duration > fadeDuration * 2) {
                    gainNode.gain.setValueAtTime(1, this.audioContext.currentTime + duration - fadeDuration);
                    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
                }

                this.source.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                this.lastPlayTime = this.audioContext.currentTime;
                logger.info(`开始播放 ${currentSamples.length} 个样本，约 ${(currentSamples.length / this.sampleRate).toFixed(2)} 秒`);
                this.source.start();
            }
            await this.getQueue(minSamples);
        }
    }
}

export function createStreamingContext(opusDecoder, audioContext, sampleRate, channels, minAudioDuration) {
    return new StreamingContext(opusDecoder, audioContext, sampleRate, channels, minAudioDuration);
}
