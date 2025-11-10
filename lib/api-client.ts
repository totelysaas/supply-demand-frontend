// API client for FastAPI backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface S3File {
  name: string
  content: string
}

export interface S3Response {
  success: boolean
  files?: S3File[]
  folders?: string[]
  error?: string
}

export interface UploadResponse {
  success: boolean
  uploaded_files?: Array<{
    name: string
    size: number
    key: string
  }>
  errors?: string[]
  error?: string
}

export async function listS3Folders(): Promise<S3Response> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/s3/folders`)
    return await response.json()
  } catch (error) {
    console.error('[API] Error listing S3 folders:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list folders',
      folders: []
    }
  }
}

export async function loadDataFromS3(folderPath: string): Promise<S3Response> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/s3/data/${encodeURIComponent(folderPath)}`)
    return await response.json()
  } catch (error) {
    console.error('[API] Error loading data from S3:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load data from S3',
      files: []
    }
  }
}

export async function uploadFilesToS3(folderPath: string, files: File[]): Promise<UploadResponse> {
  try {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    const response = await fetch(`${API_BASE_URL}/api/s3/upload/${encodeURIComponent(folderPath)}`, {
      method: 'POST',
      body: formData
    })

    return await response.json()
  } catch (error) {
    console.error('[API] Error uploading files to S3:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload files',
      uploaded_files: [],
      errors: []
    }
  }
}

export async function healthCheck(): Promise<{ status: string; s3_connection: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    return await response.json()
  } catch (error) {
    console.error('[API] Health check failed:', error)
    return { status: 'unhealthy', s3_connection: 'failed' }
  }
}
