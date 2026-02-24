import { Link } from 'react-router-dom'

export default function LearnGZCLP() {
  return (
    <div className="max-w-lg mx-auto p-6 pb-24">
      <header className="flex justify-between items-center mb-6">
        <Link to="/settings" className="text-slate-400 hover:text-slate-200">← Back</Link>
        <h1 className="text-xl font-bold text-slate-100">Learn GZCLP</h1>
        <div className="w-14" />
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-slate-200 mb-2">The Philosophy</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            GZCLP is built on the idea that training has three tiers of importance. Your heavy compound lifts (T1) are the foundation — they build raw strength. Your moderate volume work (T2) supports T1 by building muscle and reinforcing the movement patterns. Your accessories (T3) address weak points and keep you balanced. Every tier has a purpose. Skip T1 and you won&apos;t get strong. Skip T2 and your muscles won&apos;t grow enough to support heavier T1 weights. Skip T3 and your weak links will eventually stall everything.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-200 mb-2">Why the Failure Scheme Matters</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Most programs treat failure as a setback — &quot;deload and try again.&quot; GZCLP treats failure as information. If you can&apos;t do 5 sets of 3, you can probably still do 6 sets of 2 at the same weight — that&apos;s actually more total volume. And if you can&apos;t do 6×2, you can still do 10 heavy singles. You&apos;re practicing the lift at a challenging weight for longer before resetting, which means more strength adaptation. When you finally do reset, you come back to 5×3 at 85% and blow past your old plateau because you&apos;ve spent weeks handling heavier loads.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-200 mb-2">The Sawtooth Pattern</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            Weight climbs linearly, hits a wall, drops to 85%, climbs again past the previous wall. This is expected and is a sign the program is working. The second time through is always higher than the first.
          </p>
          <div className="bg-slate-800/50 rounded-xl p-6 text-center">
            <pre className="text-slate-400 text-xs font-mono whitespace-pre">
{`    /\\
   /  \\
  /    \\___
 /         \\
/           \\___`}
            </pre>
            <p className="text-slate-500 text-xs mt-2">Climb → Fail → Reset → Climb higher</p>
          </div>
        </section>
      </div>
    </div>
  )
}
