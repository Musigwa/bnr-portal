export function Footer() {
  return (
    <footer className="sticky bottom-0 z-50 w-full border-t bg-card backdrop-blur-xl">
      <div className="container mx-auto px-4 h-14 flex items-center justify-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} National Bank of Rwanda. All rights reserved.
      </div>
    </footer>
  );
}
