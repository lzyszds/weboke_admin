const cryptoJs = require("crypto-js");
// 设置加密的Key
function getKey(key = "lzy1024327189") {
  return cryptoJs
    .SHA1(cryptoJs.SHA1(key))
    .toString()
    .substring(0, 32);
}

//进行加密
function aesEncrypt(data, key) {
  // console.log('加密之前的data:', data + '   key:' + key + '   真实的key:' + getKey(key));

  const KEY = cryptoJs.enc.Hex.parse(getKey(key));
  const IV = cryptoJs.enc.Hex.parse(getKey(key));

  if (typeof data === "object") {
    try {
      data = JSON.stringify(data);
    } catch (error) {
      console.log("加密失败:", error);
    }
  }
  let encrypt = cryptoJs.AES.encrypt(data, KEY, {
    iv: IV,
    mode: cryptoJs.mode.ECB,
    padding: cryptoJs.pad.Pkcs7
  });
  console.log("加密之后的数据:", encrypt.ciphertext.toString());
  return encrypt.ciphertext.toString();
}

//进行解密
function aesDecrypt(data, key) {
  console.log('解密之前的data:', data + '   key:' + key + '   真实的key:' + getKey(key));

  const KEY = cryptoJs.enc.Hex.parse(getKey(key));
  const IV = cryptoJs.enc.Hex.parse(getKey(key));
  let str = cryptoJs.enc.Base64.stringify(cryptoJs.enc.Hex.parse(data));
  let decrypt = cryptoJs.AES.decrypt(
    str,
    KEY,
    {
      iv: IV,
      mode: cryptoJs.mode.ECB,
      padding: cryptoJs.pad.Pkcs7
    }
  );
  console.log('解密后的数据：', decrypt.toString(cryptoJs.enc.Utf8).toString())
  return decrypt.toString(cryptoJs.enc.Utf8);
}



module.exports = { aesEncrypt, aesDecrypt }

