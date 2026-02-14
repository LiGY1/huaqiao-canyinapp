// /api/auth.js
import request from '@/utils/request.js';

/**
 * 统一登录
 */
export const unifiedLogin = (data) => {
	return request({
		url: '/unified/login',
		method: 'POST',
		data
	});
};

/**
 * 获取用户信息
 */
export const getUserInfo = () => {
	return request({
		url: '/unified/userinfo',
		method: 'GET'
	});
};

/**
 * 获取门户配置
 */
export const getPortalConfig = () => {
	return request({
		url: '/unified/portal-config',
		method: 'GET'
	});
};

/**
 * 生成验证码
 */
export const generateCaptcha = () => {
	return request({
		url: '/unified/captcha/generate',
		method: 'GET'
	});
};

/**
 * 验证验证码
 */
export const verifyCaptcha = (data) => {
	return request({
		url: '/unified/captcha/verify',
		method: 'POST',
		data
	});
};