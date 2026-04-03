import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Building2 } from "lucide-react"

export default async function AdminSponsorsPage() {
  // TODO: Fetch sponsor contacts from database
  interface SponsorContact {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    interestedIn?: string;
    message?: string;
    status: string;
    created_at: string;
  }
  const contacts: SponsorContact[] = []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          SPONSOR-ANFRAGEN
        </h1>
        <p className="text-muted-foreground mt-2">
          Anfragen von potenziellen Sponsoren und Partnern verwalten
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#530A5D]" />
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
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-[#530A5D] mt-1" />
                    <div>
                      <p className="font-semibold">{contact.companyName}</p>
                      <p className="text-sm text-muted-foreground">{contact.contactName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Noch keine Sponsor-Anfragen</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
