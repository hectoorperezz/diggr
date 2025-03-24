import Image from "next/image"
import Link from "next/link"

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`block ${className}`}>
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/diggr-Jzxk94LMSWR16uHNaER842PWaRdMLp.png"
        alt="diggr logo"
        width={100}
        height={40}
        className="h-auto w-auto"
        priority
      />
    </Link>
  )
}

