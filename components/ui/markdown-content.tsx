import React from "react"
import Markdown, { defaultUrlTransform } from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import { Emails, PhoneNumbers, Urls } from "@/lib/constants"
import { normalizeUrl } from "@/lib/helpers"

interface MarkdownContentPropsType {
  children: string
}

export default function MarkdownContent({ children }: MarkdownContentPropsType) {
  const replaceList: Record<string, string> = {
    "email-contact-hslu": Emails.contactHSLU,
    "email-url-contact-hslu": `mailto:${Emails.contactHSLU}`,
    "phone-contact-hslu": PhoneNumbers.contactHSLU,
    "phone-url-contact-hslu": `tel:${PhoneNumbers.contactHSLU.replaceAll(" ", "")}`,
    "url-contact-hslu": Urls.contactHSLU,
    "website-contact-hslu": normalizeUrl(Urls.contactHSLU)
  }

  let content = children || ""
  Object.entries(replaceList).forEach(([k, v]) => {
    content = content.replaceAll("{{" + k + "}}", v)
  })

  return (
    <div className="md-content">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        urlTransform={(url: string) => (url.startsWith("tel:") ? url : defaultUrlTransform(url))}
        components={{
          a(props: React.ComponentProps<"a">) {
            return (
              <a href={props.href} target="_blank" className="text-primary hover:underline">
                {props.children}
              </a>
            )
          }
        }}>
        {content}
      </Markdown>
    </div>
  )
}
