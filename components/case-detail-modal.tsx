"use client"

import { useState } from "react"
import type { CaseItem } from "@/lib/casesStore"
import { X, Download, Copy, CheckCircle2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

interface CaseDetailModalProps {
  caseData: Pick<
    CaseItem,
    | "id"
    | "title"
    | "original_cv_url"
    | "redacted_cv_url"
    | "email_subject"
    | "email_body"
    | "contacts"
    | "confirm_url"
  >
  onClose: () => void
}

export function CaseDetailModal({ caseData, onClose }: CaseDetailModalProps) {
  const [contactSearch, setContactSearch] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set())
  const [sortField, setSortField] = useState<"firma" | "email" | "plz">("firma")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    console.log("[v0] Copied to clipboard")
  }

  const handleConfirm = async () => {
    try {
      const url = caseData.confirm_url
      if (!url) {
        console.warn("[v0] No confirm_url set on case", caseData.id)
        return
      }
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caseData.id }),
      })
      console.log("[v0] Case confirmed:", caseData.id)
    } catch (error) {
      console.error("[v0] Error confirming case:", error)
    }
  }

  const toggleContact = (index: number) => {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedContacts(newSelected)
  }

  const handleSort = (field: "firma" | "email" | "plz") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredAndSortedContacts = caseData.contacts
    .filter((contact) => {
      const query = contactSearch.toLowerCase()
      return (
        contact.firma.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.plz.includes(query)
      )
    })
    .sort((a, b) => {
      const aVal = a[sortField].toLowerCase()
      const bVal = b[sortField].toLowerCase()
      const comparison = aVal.localeCompare(bVal)
      return sortDirection === "asc" ? comparison : -comparison
    })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative h-[90vh] w-full max-w-5xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-6 py-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{caseData.title}</h2>
            <p className="text-sm text-muted-foreground">Case #{caseData.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleConfirm} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Bestätigen
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="h-[calc(90vh-80px)] overflow-y-auto px-6 py-6">
          <div className="space-y-8">
            {/* CVs Section */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Lebenslauf (Original)</h3>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="mb-3 aspect-[3/4] rounded bg-muted/50 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">PDF Vorschau</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-border text-foreground hover:bg-secondary bg-transparent"
                    onClick={() => window.open(caseData.original_cv_url, "_blank")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Herunterladen
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Geschwärzter Lebenslauf</h3>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="mb-3 aspect-[3/4] rounded bg-muted/50 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">PDF Vorschau</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-border text-foreground hover:bg-secondary bg-transparent"
                    onClick={() => window.open(caseData.redacted_cv_url, "_blank")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Herunterladen
                  </Button>
                </div>
              </div>
            </div>

            {/* Email Subject */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">E-Mail Subject</h3>
              <div className="flex gap-2">
                <Input
                  value={caseData.email_subject}
                  readOnly
                  className="flex-1 bg-secondary/30 border-border text-foreground font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(caseData.email_subject)}
                  className="border-border text-foreground hover:bg-secondary"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Email Body */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">E-Mail Body</h3>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div
                  className="prose prose-sm prose-invert max-w-none text-foreground"
                  dangerouslySetInnerHTML={{ __html: caseData.email_body }}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => handleCopy(caseData.email_body)}
                className="w-full border-border text-foreground hover:bg-secondary"
              >
                <Copy className="mr-2 h-4 w-4" />
                In Zwischenablage kopieren
              </Button>
            </div>

            {/* Contacts Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Ansprechpartner ({caseData.contacts.length})</h3>
                <p className="text-sm text-muted-foreground">{selectedContacts.size} ausgewählt</p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Suche in Ansprechpartnern..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="pl-9 bg-secondary/30 border-border text-foreground"
                />
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="w-12 text-muted-foreground">
                        <Checkbox />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => handleSort("firma")}
                      >
                        Firma {sortField === "firma" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => handleSort("email")}
                      >
                        E-Mail {sortField === "email" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => handleSort("plz")}
                      >
                        PLZ {sortField === "plz" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedContacts.map((contact, index) => (
                      <TableRow key={index} className="border-border hover:bg-muted/30">
                        <TableCell>
                          <Checkbox
                            checked={selectedContacts.has(index)}
                            onCheckedChange={() => toggleContact(index)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{contact.firma}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{contact.email}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{contact.plz}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
