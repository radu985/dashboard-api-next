import { NextResponse } from "next/server"
import { casesStore, type CaseItem } from "@/lib/casesStore"

export async function GET() {
  const all = await casesStore.list()
  return NextResponse.json({ cases: all })
}

export async function POST(req: Request) {
  console.log("POST REQUEST FROM /api/cases")
  const token = process.env.CASES_TOKEN
  if (token && req.headers.get("x-cases-token") !== token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const items: CaseItem[] = Array.isArray(body) ? body : [body]
    await casesStore.push(...items)
    return NextResponse.json({ ok: true, count: items.length })
  } catch (e) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }
}


