import "server-only"

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto"

const ALGORITHM = "aes-256-gcm"
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT = "mercadopago-syncro"

function getKey() {
  const encryptionKey = process.env.MP_ENCRYPTION_KEY

  if (!encryptionKey) {
    throw new Error("MP_ENCRYPTION_KEY no está configurada.")
  }

  return scryptSync(encryptionKey, SALT, KEY_LENGTH)
}

export function encrypt(text: string) {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`
}

export function decrypt(payload: string) {
  const [ivHex, authTagHex, encryptedHex] = payload.split(":")

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Payload encriptado inválido.")
  }

  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"))
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"))

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8")
}
