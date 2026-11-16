import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16">
      <h1 className="text-5xl">No player on this page</h1>
      <p className="mt-3 max-w-prose text-mute">
        That link does not match a player with fantasy points this season. Search by name from the home page.
      </p>
      <Link href="/" className="mt-6 inline-block rounded-md bg-gold px-4 py-2 font-semibold text-field">Go to home</Link>
    </div>
  );
}
