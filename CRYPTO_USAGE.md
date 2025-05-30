# 加密系统使用指南

## 概述

本加密系统提供了两种主要的加密方式：
1. **密码加密** - 使用密码派生密钥进行对称加密
2. **公钥加密** - 使用ECIES进行非对称加密，支持数字签名

## 文件加密

### 密码加密文件
```typescript
import { streamCrypto } from '@/lib/crypto-stream'

// 加密
const encryptedBlob = await streamCrypto.encrypt.withPassword({
  file: myFile,
  password: 'mySecurePassword',
  onProgress: (progress) => console.log(`${progress}%`),
  onStage: (stage) => console.log(stage)
})

// 解密
const decryptedBlob = await streamCrypto.decrypt.withPassword({
  file: encryptedFile,
  password: 'mySecurePassword',
  onProgress: (progress) => console.log(`${progress}%`),
  onStage: (stage) => console.log(stage)
})
```

### 公钥加密文件（无签名）
```typescript
// 加密
const encryptedBlob = await streamCrypto.encrypt.withPublicKey({
  file: myFile,
  receiver: receiverPublicKey, // Uint8Array
  onProgress: (progress) => console.log(`${progress}%`)
})

// 解密
const decryptedBlob = await streamCrypto.decrypt.withPrivateKey({
  file: encryptedFile,
  receiver: receiverPrivateKey, // Uint8Array
  onProgress: (progress) => console.log(`${progress}%`)
})
```

### 公钥加密文件（带签名）
```typescript
// 加密（带签名）
const encryptedBlob = await streamCrypto.encrypt.withPublicKey({
  file: myFile,
  receiver: receiverPublicKey,
  sender: { privKeyBytes: senderPrivateKey }, // 签名用
  onProgress: (progress) => console.log(`${progress}%`)
})

// 解密（验证签名）
const decryptedBlob = await streamCrypto.decrypt.withPrivateKey({
  file: encryptedFile,
  receiver: receiverPrivateKey,
  sender: senderPublicKey, // 验证签名用
  onProgress: (progress) => console.log(`${progress}%`),
  onStage: (stage) => {
    if (stage === 'Signature verification failed') {
      console.warn('文件签名验证失败！')
    }
  }
})
```

## 文本加密

### 密码加密文本
```typescript
import { textCrypto } from '@/lib/crypto-stream'

// 加密
const encryptedText = await textCrypto.encrypt(
  'Hello, World!',
  'myPassword'
)
// 返回: Base64编码的加密字符串

// 解密
const { text } = await textCrypto.decrypt(
  encryptedText,
  'myPassword'
)
// 返回: { text: 'Hello, World!' }
```

### 公钥加密文本（无签名）
```typescript
// 加密
const encryptedText = await textCrypto.encrypt(
  'Hello, World!',
  undefined, // 不使用密码
  receiverPublicKey
)

// 解密
const { text } = await textCrypto.decrypt(
  encryptedText,
  undefined, // 不使用密码
  receiverPrivateKey
)
```

### 公钥加密文本（带签名）
```typescript
// 加密（带签名）
const encryptedText = await textCrypto.encrypt(
  'Hello, World!',
  undefined,
  receiverPublicKey,
  { privKeyBytes: senderPrivateKey }
)

// 解密（验证签名）
const { text, signatureValid } = await textCrypto.decrypt(
  encryptedText,
  undefined,
  receiverPrivateKey,
  senderPublicKey
)

if (signatureValid === false) {
  console.warn('签名验证失败！')
}
```

## 密钥生成

### 生成密钥对（使用@noble/curves）
```typescript
import { secp256k1 } from '@noble/curves/secp256k1'

// 生成私钥
const privateKey = secp256k1.utils.randomPrivateKey()

// 从私钥导出公钥
const publicKey = secp256k1.getPublicKey(privateKey)
```

### 使用助记词生成密钥（示例）
```typescript
import * as bip39 from 'bip39'
import { HDKey } from '@scure/bip32'

// 生成助记词
const mnemonic = bip39.generateMnemonic()

// 从助记词生成种子
const seed = bip39.mnemonicToSeedSync(mnemonic)

// 派生密钥
const masterNode = HDKey.fromMasterSeed(seed)
const key = masterNode.derive("m/44'/0'/0'/0/0")

const privateKey = key.privateKey
const publicKey = key.publicKey
```

## 文件格式

### NS0 - 公钥加密（无签名）
```
[ns0][headerLength(2)][encryptedHeader][encryptedKeyLength(2)][encryptedKey][data]
```

### NS1 - 密码加密
```
[ns1][headerLength(2)][salt(16)][encryptedHeader][data]
```

### NS2 - 公钥加密（带签名）
```
[ns2][headerLength(2)][encryptedHeader][encryptedKeyLength(2)][encryptedKey][data]
```
Header中包含签名

## 性能优化

- 文件分块处理：10MB/块
- 流式处理：支持大文件
- 内存限制：最大100MB
- 异步处理：不阻塞UI

## 安全特性

- **密码加密**：Argon2id + AES-GCM
- **公钥加密**：ECIES + AES-GCM
- **签名算法**：secp256k1
- **哈希算法**：SHA-256
- **安全内存清除**：使用后清除密钥

## 错误处理

```typescript
try {
  const encrypted = await streamCrypto.encrypt.withPassword({
    file: myFile,
    password: 'password'
  })
} catch (error) {
  if (error.code === 'INVALID_DATA') {
    console.error('无效的数据格式')
  } else if (error.code === 'DECRYPTION_FAILED') {
    console.error('解密失败')
  }
}
``` 