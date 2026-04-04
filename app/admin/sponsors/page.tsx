import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Building2 } from "lucide-react"

export default async function AdminSponsorsPage() {
  // TODO: Fetch sponsor contacts from database
  interface SponsorContact {
    id: string
    companyName: string
    contactName: string
    email: string
    phone?: string
    interestedIn?: string
    message?: string
    status: string
    created_at: string
  }
  const contacts: SponsorContact[] = []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          SPONSOR-ANFRAGEN
        </h1>
        <p className="text-muted-foreground mt-2">
          Anfragen von potenziellen Sponsoren und Partnern verwalten
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#530A5D]" />
            Alle Anfragen
          </CardTitle>
          <CardDescription>{contacts.length || 0} Anfragen insgesamt</CardDescription>
        </CardHeader>
        <CardContent>
          {contacts && contacts.length > 0 ? (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="border-border hover:bg-muted/50 rounded-lg border p-4 transition-colors">
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-1 h-5 w-5 text-[#530A5D]" />
                    <div>
                      <p className="font-semibold">{contact.companyName}</p>
                      <p className="text-muted-foreground text-sm">{contact.contactName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center">Noch keine Sponsor-Anfragen</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
