"use server"

// Manual AWS Signature V4 implementation to avoid AWS SDK stream issues
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message))
  return new Uint8Array(signature)
}

async function getSignatureKey(
  key: string,
  dateStamp: string,
  regionName: string,
  serviceName: string,
): Promise<Uint8Array> {
  const kDate = await hmacSha256(new TextEncoder().encode("AWS4" + key), dateStamp)
  const kRegion = await hmacSha256(kDate, regionName)
  const kService = await hmacSha256(kRegion, serviceName)
  const kSigning = await hmacSha256(kService, "aws4_request")
  return kSigning
}

export async function listS3Objects(bucket: string, prefix = "") {
  const region = process.env.AWS_REGION || "us-east-1"
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials not configured")
  }

  const host = `${bucket}.s3.${region}.amazonaws.com`
  const endpoint = `https://${host}/`

  // Create timestamp
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
  const dateStamp = amzDate.slice(0, 8)

  // Build canonical request
  const method = "GET"
  const canonicalUri = "/"
  const canonicalQuerystring = prefix ? `list-type=2&prefix=${encodeURIComponent(prefix)}` : "list-type=2"
  const payloadHash = await sha256("")
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date"

  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

  // Create string to sign
  const algorithm = "AWS4-HMAC-SHA256"
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`

  // Calculate signature
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, "s3")
  const signatureBytes = await hmacSha256(signingKey, stringToSign)
  const signature = Array.from(signatureBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  // Build authorization header
  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  // Make request
  const url = `${endpoint}?${canonicalQuerystring}`
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Host: host,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      Authorization: authorizationHeader,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`S3 request failed: ${response.status} ${response.statusText}\n${errorText}`)
  }

  const xmlText = await response.text()
  console.log("[v0] S3 XML Response:", xmlText.substring(0, 500)) // Debug log to see XML response

  const files: Array<{ key: string; size: number }> = []

  // Extract all <Contents> blocks
  const contentsRegex = /<Contents>([\s\S]*?)<\/Contents>/g
  let match

  while ((match = contentsRegex.exec(xmlText)) !== null) {
    const contentBlock = match[1]

    // Extract Key
    const keyMatch = contentBlock.match(/<Key>(.*?)<\/Key>/)
    const key = keyMatch ? keyMatch[1] : ""

    // Extract Size
    const sizeMatch = contentBlock.match(/<Size>(.*?)<\/Size>/)
    const size = sizeMatch ? Number.parseInt(sizeMatch[1], 10) : 0

    // Only include CSV files
    if (key && key.toLowerCase().endsWith(".csv")) {
      files.push({ key, size })
    }
  }

  console.log("[v0] Parsed files:", files) // Debug log to see parsed files
  return files
}

export async function getS3Object(bucket: string, key: string): Promise<string> {
  const region = process.env.AWS_REGION || "us-east-1"
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials not configured")
  }

  const host = `${bucket}.s3.${region}.amazonaws.com`
  const endpoint = `https://${host}/${encodeURIComponent(key).replace(/%2F/g, "/")}`

  // Create timestamp
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
  const dateStamp = amzDate.slice(0, 8)

  // Build canonical request
  const method = "GET"
  const canonicalUri = `/${key}`
  const canonicalQuerystring = ""
  const payloadHash = await sha256("")
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date"

  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

  // Create string to sign
  const algorithm = "AWS4-HMAC-SHA256"
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`

  // Calculate signature
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, "s3")
  const signatureBytes = await hmacSha256(signingKey, stringToSign)
  const signature = Array.from(signatureBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  // Build authorization header
  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  // Make request
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Host: host,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      Authorization: authorizationHeader,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`S3 request failed: ${response.status} ${response.statusText}\n${errorText}`)
  }

  return await response.text()
}

export async function putS3Object(bucket: string, key: string, content: string | ArrayBuffer): Promise<void> {
  const region = process.env.AWS_REGION || "us-east-1"
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials not configured")
  }

  const host = `${bucket}.s3.${region}.amazonaws.com`
  const endpoint = `https://${host}/${encodeURIComponent(key).replace(/%2F/g, "/")}`

  // Create timestamp
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
  const dateStamp = amzDate.slice(0, 8)

  // Convert content to string for hashing
  const contentString = typeof content === "string" ? content : new TextDecoder().decode(content)
  const payloadHash = await sha256(contentString)

  // Build canonical request
  const method = "PUT"
  const canonicalUri = `/${key}`
  const canonicalQuerystring = ""
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date"

  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

  // Create string to sign
  const algorithm = "AWS4-HMAC-SHA256"
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`

  // Calculate signature
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, "s3")
  const signatureBytes = await hmacSha256(signingKey, stringToSign)
  const signature = Array.from(signatureBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  // Build authorization header
  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  // Make request
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Host: host,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      Authorization: authorizationHeader,
      "Content-Type": "text/csv",
    },
    body: content,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`S3 upload failed: ${response.status} ${response.statusText}\n${errorText}`)
  }
}
