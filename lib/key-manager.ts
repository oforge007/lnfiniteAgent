import crypto from "crypto"

interface KeyStore {
  encryptedPrivateKey: string
  publicKey: string
  nonce: string
  createdAt: number
  permissions: TransactionPermission[]
}

interface TransactionPermission {
  target: string // Contract address
  selector: string // Function selector
  maxAmount: bigint
  dailyLimit: bigint
  used: bigint
  lastResetTime: number
}

export class AgentKeyManager {
  private keyStore: Map<string, KeyStore> = new Map()
  private masterKey: Buffer

  constructor() {
    // NEVER use hardcoded keys in production - use Turnkey or similar
    const masterKeyHex = process.env.AGENT_MASTER_KEY
    if (!masterKeyHex) {
      throw new Error("AGENT_MASTER_KEY not set")
    }
    this.masterKey = Buffer.from(masterKeyHex, "hex")
  }

  async storeAgentKey(agentId: string, privateKey: string, permissions: TransactionPermission[]): Promise<void> {
    const publicKey = this.derivePublicKey(privateKey)

    // Encrypt with random IV
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv("aes-256-gcm", this.masterKey, iv)

    let encrypted = cipher.update(privateKey, "utf8", "hex")
    encrypted += cipher.final("hex")
    const authTag = cipher.getAuthTag().toString("hex")

    this.keyStore.set(agentId, {
      encryptedPrivateKey: `${iv.toString("hex")}:${encrypted}:${authTag}`,
      publicKey,
      nonce: crypto.randomBytes(32).toString("hex"),
      createdAt: Date.now(),
      permissions: permissions.map((p) => ({
        ...p,
        used: 0n,
        lastResetTime: Date.now(),
      })),
    })
  }

  async getAgentKey(agentId: string): Promise<string> {
    const store = this.keyStore.get(agentId)
    if (!store) {
      throw new Error("Agent key not found")
    }

    const [ivHex, encryptedHex, authTagHex] = store.encryptedPrivateKey.split(":")
    const iv = Buffer.from(ivHex, "hex")
    const encrypted = Buffer.from(encryptedHex, "hex")
    const authTag = Buffer.from(authTagHex, "hex")

    const decipher = crypto.createDecipheriv("aes-256-gcm", this.masterKey, iv)
    decipher.setAuthTag(authTag)

    let privateKey = decipher.update(encrypted.toString("hex"), "hex", "utf8")
    privateKey += decipher.final("utf8")

    return privateKey
  }

  async validateTransaction(
    agentId: string,
    targetContract: string,
    functionSelector: string,
    amount: bigint,
  ): Promise<boolean> {
    const store = this.keyStore.get(agentId)
    if (!store) return false

    const permission = store.permissions.find((p) => p.target === targetContract && p.selector === functionSelector)
    if (!permission) return false

    // Reset daily limit if needed
    if (Date.now() - permission.lastResetTime > 86400000) {
      permission.used = 0n
      permission.lastResetTime = Date.now()
    }

    // Check limits
    if (amount > permission.maxAmount) return false
    if (permission.used + amount > permission.dailyLimit) return false

    permission.used += amount
    return true
  }

  private derivePublicKey(privateKey: string): string {
    // This is a simplified example - use proper elliptic curve operations
    const hash = crypto.createHash("sha256")
    hash.update(privateKey)
    return hash.digest("hex")
  }

  async revokeAgent(agentId: string): Promise<void> {
    this.keyStore.delete(agentId)
  }
}

export const keyManager = new AgentKeyManager()
