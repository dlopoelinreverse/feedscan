export function Footer() {
  return (
    <footer className="border-t border-border py-8 px-4 text-center">
      <p className="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} FeedScan. All rights reserved.
      </p>
    </footer>
  );
}
