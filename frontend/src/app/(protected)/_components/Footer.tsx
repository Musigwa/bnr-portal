export function Footer() {
  return (
    <footer className="bg-card sticky bottom-0 z-50 w-full border-t backdrop-blur-xl">
      <div className="text-muted-foreground container mx-auto flex h-14 items-center justify-center px-4 text-xs">
        &copy; {new Date().getFullYear()} National Bank of Rwanda. All rights
        reserved.
      </div>
    </footer>
  );
}
