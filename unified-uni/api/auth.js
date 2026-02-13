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