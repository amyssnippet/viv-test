import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"

interface InfoBoxProps {
  infobox: {
    infobox: string
    content: string
    img_src?: string
    urls?: Array<{
      title: string
      url: string
      official?: boolean
    }>
    attributes?: Array<{
      label: string
      value: string
    }>
  }
}

export function InfoBox({ infobox }: InfoBoxProps) {
  if (!infobox) return null

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="bg-slate-50 pb-2">
        <CardTitle className="text-lg">{infobox.infobox}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {infobox.img_src && (
            <div className="flex justify-center">
              <div className="relative h-48 w-full overflow-hidden rounded-md">
                <img
                  src={infobox.img_src || "/placeholder.svg"}
                  alt={infobox.infobox}
                  className="object-contain"
                />
              </div>
            </div>
          )}

          <p className="text-sm text-slate-700">{infobox.content}</p>

          {infobox.attributes && infobox.attributes.length > 0 && (
            <div className="space-y-2 rounded-md bg-slate-50 p-3">
              {infobox.attributes.slice(0, 5).map((attr, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 text-sm">
                  <span className="font-medium text-slate-700">{attr.label}:</span>
                  <span className="col-span-2 text-slate-600">{attr.value}</span>
                </div>
              ))}
            </div>
          )}

          {infobox.urls && infobox.urls.length > 0 && (
            <div className="space-y-1 pt-2">
              <h4 className="text-sm font-medium text-slate-700">Related Links</h4>
              <div className="space-y-1">
                {infobox.urls.slice(0, 3).map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    {link.title}
                    {link.official && <span className="text-xs text-green-600">(Official)</span>}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
