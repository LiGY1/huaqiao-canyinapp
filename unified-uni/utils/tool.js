import JSEncrypt from 'jsencrypt';


const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQD2YUAPUvwNiRsTjCwlAmsTY1t0
8/8kUoynyLzD5J7+9/2OFkw8GQSG6mE/GT++PJm531bUupcGBrp2BTPicfE2otAh
Nk0tKR2UbzJqwH4zFB8jKzKteTDVAgYPy997p7eOOr0Sf2KKSAVFcrSa87sr+x1F
Qo5Zqk8kGzBjp88ZdQIDAQAB
-----END PUBLIC KEY-----`
/**
 * 函数节流
 */
export function throttle(fn, delay = 500) {
  let timer = null;
  return function (...args) {
    if (timer) return;
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}

export function delay(delay = 500) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, delay);
  });
}

export const encryptPwd = (password) => {
  const encryptor = new JSEncrypt();
  // 设置公钥
  encryptor.setPublicKey(publicKey)
  const encryptedPassword = encryptor.encrypt(password);

  if (!encryptedPassword) {
    throw new Error('密码加密失败');
  }

  return encryptedPassword;
}