import logger from './logger.js';

export function checkOpusLoaded() {
    try {
        if (typeof Module === 'undefined') {
            throw new Error('Opus库未加载，Module对象不存在');
        }

        if (typeof Module.instance !== 'undefined' && typeof Module.instance._opus_decoder_get_size === 'function') {
            // @ts-ignore
            window.ModuleInstance = Module.instance;
            logger.info('Opus库加载成功（使用Module.instance）');
            return true;
        }

        if (typeof Module._opus_decoder_get_size === 'function') {
            // @ts-ignore
            window.ModuleInstance = Module;
            logger.info('Opus库加载成功（使用全局Module）');
            return true;
        }

        throw new Error('Opus解码函数未找到，可能Module结构不正确');
    } catch (err) {
        logger.error(`Opus库加载失败: ${err.message}`);
        return false;
    }
}

let opusEncoder = null;
export function initOpusEncoder() {
    try {
        if (opusEncoder) {
            return opusEncoder;
        }

        // @ts-ignore
        if (!window.ModuleInstance) {
            logger.error('无法创建Opus编码器：ModuleInstance不可用');
            return null;
        }

        // @ts-ignore
        const mod = window.ModuleInstance;
        const sampleRate = 16000;
        const channels = 1;
        const application = 2048;

        opusEncoder = {
            channels: channels,
            sampleRate: sampleRate,
            frameSize: 960,
            maxPacketSize: 4000,
            module: mod,

            init: function () {
                try {
                    const encoderSize = mod._opus_encoder_get_size(this.channels);
                    logger.info(`Opus编码器大小: ${encoderSize}字节`);

                    this.encoderPtr = mod._malloc(encoderSize);
                    if (!this.encoderPtr) {
                        throw new Error("无法分配编码器内存");
                    }

                    const err = mod._opus_encoder_init(
                        this.encoderPtr,
                        this.sampleRate,
                        this.channels,
                        application
                    );

                    if (err < 0) {
                        throw new Error(`Opus编码器初始化失败: ${err}`);
                    }

                    mod._opus_encoder_ctl(this.encoderPtr, 4002, 16000);
                    mod._opus_encoder_ctl(this.encoderPtr, 4010, 5);
                    mod._opus_encoder_ctl(this.encoderPtr, 4016, 1);

                    logger.info("Opus编码器初始化成功");
                    return true;
                } catch (error) {
                    if (this.encoderPtr) {
                        mod._free(this.encoderPtr);
                        this.encoderPtr = null;
                    }
                    logger.error(`Opus编码器初始化失败: ${error.message}`);
                    return false;
                }
            },

            encode: function (pcmData) {
                if (!this.encoderPtr) {
                    if (!this.init()) {
                        return null;
                    }
                }

                try {
                    const mod = this.module;
                    const pcmPtr = mod._malloc(pcmData.length * 2);

                    for (let i = 0; i < pcmData.length; i++) {
                        mod.HEAP16[(pcmPtr >> 1) + i] = pcmData[i];
                    }

                    const outPtr = mod._malloc(this.maxPacketSize);

                    const encodedLen = mod._opus_encode(
                        this.encoderPtr,
                        pcmPtr,
                        this.frameSize,
                        outPtr,
                        this.maxPacketSize
                    );

                    if (encodedLen < 0) {
                        throw new Error(`Opus编码失败: ${encodedLen}`);
                    }

                    const opusData = new Uint8Array(encodedLen);
                    for (let i = 0; i < encodedLen; i++) {
                        opusData[i] = mod.HEAPU8[outPtr + i];
                    }

                    mod._free(pcmPtr);
                    mod._free(outPtr);

                    return opusData;
                } catch (error) {
                    logger.error(`Opus编码出错: ${error.message}`);
                    return null;
                }
            },

            destroy: function () {
                if (this.encoderPtr) {
                    this.module._free(this.encoderPtr);
                    this.encoderPtr = null;
                }
            }
        };

        opusEncoder.init();
        return opusEncoder;
    } catch (error) {
        logger.error(`创建Opus编码器失败: ${error.message}`);
        return null;
    }
}

let opusDecoder = null;
export async function initOpusDecoder() {
    if (opusDecoder) return opusDecoder;

    try {
        // @ts-ignore
        if (typeof window.ModuleInstance === 'undefined') {
            // @ts-ignore
            if (typeof Module !== 'undefined') {
                // @ts-ignore
                window.ModuleInstance = Module;
                logger.info('使用全局Module作为ModuleInstance');
            } else {
                throw new Error('Opus库未加载，ModuleInstance和Module对象都不存在');
            }
        }

        // @ts-ignore
        const mod = window.ModuleInstance;
        const CHANNELS = 1;
        const SAMPLE_RATE = 16000;
        const FRAME_SIZE = 960;

        opusDecoder = {
            channels: CHANNELS,
            rate: SAMPLE_RATE,
            frameSize: FRAME_SIZE,
            module: mod,
            decoderPtr: null,

            init: function () {
                if (this.decoderPtr) return true;

                const decoderSize = mod._opus_decoder_get_size(this.channels);
                logger.debug(`Opus解码器大小: ${decoderSize}字节`);

                this.decoderPtr = mod._malloc(decoderSize);
                if (!this.decoderPtr) {
                    throw new Error("无法分配解码器内存");
                }

                const err = mod._opus_decoder_init(
                    this.decoderPtr,
                    this.rate,
                    this.channels
                );

                if (err < 0) {
                    this.destroy();
                    throw new Error(`Opus解码器初始化失败: ${err}`);
                }

                logger.info("Opus解码器初始化成功");
                return true;
            },

            decode: function (opusData) {
                if (!this.decoderPtr) {
                    if (!this.init()) {
                        throw new Error("解码器未初始化且无法初始化");
                    }
                }

                try {
                    const mod = this.module;

                    const opusPtr = mod._malloc(opusData.length);
                    mod.HEAPU8.set(opusData, opusPtr);

                    const pcmPtr = mod._malloc(this.frameSize * 2);

                    const decodedSamples = mod._opus_decode(
                        this.decoderPtr,
                        opusPtr,
                        opusData.length,
                        pcmPtr,
                        this.frameSize,
                        0
                    );

                    if (decodedSamples < 0) {
                        mod._free(opusPtr);
                        mod._free(pcmPtr);
                        throw new Error(`Opus解码失败: ${decodedSamples}`);
                    }

                    const decodedData = new Int16Array(decodedSamples);
                    for (let i = 0; i < decodedSamples; i++) {
                        decodedData[i] = mod.HEAP16[(pcmPtr >> 1) + i];
                    }

                    mod._free(opusPtr);
                    mod._free(pcmPtr);

                    return decodedData;
                } catch (error) {
                    logger.error(`Opus解码错误: ${error.message}`);
                    return new Int16Array(0);
                }
            },

            destroy: function () {
                if (this.decoderPtr) {
                    this.module._free(this.decoderPtr);
                    this.decoderPtr = null;
                }
            }
        };

        if (!opusDecoder.init()) {
            throw new Error("Opus解码器初始化失败");
        }

        return opusDecoder;

    } catch (error) {
        logger.error(`Opus解码器初始化失败: ${error.message}`);
        opusDecoder = null;
        throw error;
    }
}
