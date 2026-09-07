import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function addSubscriber(email: string): Promise<string> {
  const { data, error } = await resend.contacts.create({
    email,
    unsubscribed: false
  })

  if (error) {
    throw new Error(`Resend contact could not be created: ${error.message}`)
  }

  return data.id
}

export async function removeSubscriber(email: string): Promise<void> {
  const { error } = await resend.contacts.remove({
    email
  })

  if (error) {
    if (error.statusCode == 404) {
      // not found, already not in subscribers list
      return
    }

    throw new Error(`Resend contact could not be removed: ${error.message}`)
  }
}

export async function getAllSubscribers(): Promise<string[]> {
  const emails: string[] = []
  let after: string | undefined = undefined

  while (true) {
    const { data, error } = await resend.contacts.list({
      limit: 100,
      ...(after ? { after } : {})
    })

    if (error) {
      throw new Error(`Failed to fetch contacts: ${error.message}`)
    }

    if (!data || data.data.length === 0) {
      break
    }

    for (const contact of data.data) {
      if (!contact.unsubscribed) {
        emails.push(contact.email)
      }
    }

    if (!data.has_more) {
      break
    }

    after = data.data[data.data.length - 1].id
  }

  return emails
}
