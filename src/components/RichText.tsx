import { PortableText } from '@portabletext/react'

const components = {
  block: {
    normal: ({ children }: any) => (
      <p className="text-gray-600 leading-relaxed mb-3 last:mb-0">{children}</p>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-lg font-bold text-gray-800 mt-5 mb-2">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-base font-semibold text-gray-800 mt-4 mb-1">{children}</h3>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-3 border-indigo-200 pl-4 italic text-gray-500 my-3">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="list-disc list-inside space-y-1 mb-3 text-gray-600">{children}</ul>
    ),
    number: ({ children }: any) => (
      <ol className="list-decimal list-inside space-y-1 mb-3 text-gray-600">{children}</ol>
    ),
  },
  marks: {
    strong: ({ children }: any) => (
      <strong className="font-semibold text-gray-800">{children}</strong>
    ),
    em: ({ children }: any) => <em className="italic">{children}</em>,
  },
}

export default function RichText({ value }: { value: any[] }) {
  return (
    <div>
      <PortableText value={value} components={components} />
    </div>
  )
}
