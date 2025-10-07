import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { put } from "@vercel/blob"

export const runtime = "nodejs"

function ensureUploadsDir(): string {
  const uploadsDir = path.join(process.cwd(), "public", "uploads")
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
  return uploadsDir
}

async function saveFile(file: File | null, prefix: string) {
  if (!file) return null
  const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const ext = path.extname(file.name || ".pdf") || ".pdf"
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`

  if (useBlob) {
    const res = await put(`cases/${fileName}`, buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: "application/pdf",
    })
    return res.url
  }

  const uploadsDir = ensureUploadsDir()
  const filePath = path.join(uploadsDir, fileName)
  fs.writeFileSync(filePath, buffer)
  return `/uploads/${fileName}`
}

export async function POST(req: Request) {
  try {
    const token = process.env.CASES_TOKEN
    if (token && req.headers.get("x-cases-token") !== token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const form = await req.formData()
    const original = form.get("original") as File | null
    const redacted = form.get("redacted") as File | null

    if (!original && !redacted) {
      return NextResponse.json({ error: "no_files" }, { status: 400 })
    }

    const originalUrl = await saveFile(original, "original")
    const redactedUrl = await saveFile(redacted, "redacted")

    return NextResponse.json({ ok: true, urls: { original: originalUrl, redacted: redactedUrl } })
  } catch (e) {
    return NextResponse.json({ error: "upload_failed" }, { status: 500 })
  }
}


