export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/60 px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex items-center gap-2">
          <img src="/ship-logos/ship_logo.svg" alt="Ship" className="size-5" />
          <span className="text-sm font-semibold">Ship Studio</span>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {year} Micah Cotton. All rights reserved.
        </p>
        <a
          href="https://getship.dev"
          className="text-xs text-muted-foreground transition hover:text-foreground"
        >
          getship.dev
        </a>
      </div>
    </footer>
  )
}
