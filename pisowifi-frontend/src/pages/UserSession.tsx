import ActiveSessions from "../components/ActiveSessions";

export default function UserSession() {
  return (
    <div className="flex flex-col gap-4">
      <ActiveSessions />
      <section className="rounded-xl bg-navy-800 p-5">
        <h2 className="text-sm font-medium">Session history</h2>
        <p className="py-10 text-center text-sm text-content-muted">
          Past sessions will appear here once the API is wired up.
        </p>
      </section>
    </div>
  );
}
