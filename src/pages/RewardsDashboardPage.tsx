import React, {useState} from 'react';
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  Trophy,
  X,
} from 'lucide-react';
import {REWARD_MILESTONES, REWARD_RULES} from '../constants/civicDomain';
import {useCitiSolve} from '../context/CitiSolveContext';
import type {RewardMilestoneTier} from '../types/civic';

export const RewardsDashboardPage: React.FC = () => {
  const {
    currentUser,
    rewards,
    leaderboard,
    totalAwardedPoints,
    totalPendingPoints,
  } = useCitiSolve();

  const [boardScope, setBoardScope] = useState<'locality' | 'district'>('locality');
  const [certPreviewTier, setCertPreviewTier] =
    useState<RewardMilestoneTier | null>(null);

  const userTransactions = rewards.filter(
    (r) => currentUser && r.userId === currentUser.id
  );

  const nextMilestone =
    REWARD_MILESTONES.find((m) => totalAwardedPoints < m.pointsRequired) ??
    REWARD_MILESTONES[REWARD_MILESTONES.length - 1];
  const progressPct = Math.min(100, Math.round((totalAwardedPoints / 100) * 100));

  const coinCount = Math.min(20, Math.max(1, Math.floor(totalAwardedPoints / 5)));

  const filteredLeaderboard = leaderboard.filter((entry) => {
    if (boardScope === 'locality' && currentUser) {
      return entry.ward === currentUser.hierarchy.ward;
    }
    return true;
  });

  const userRank =
    filteredLeaderboard.findIndex((e) => e.isCurrentUser) + 1 || null;

  const activeCertMilestone = certPreviewTier
    ? REWARD_MILESTONES.find((m) => m.tier === certPreviewTier)
    : null;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              My Points &amp; Civic Recognition
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Transparent demonstration reward ledger with anti-spam single-action rules and milestone recognition.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            Platform Recognition · Does not promise automatic government employment
          </span>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-6 lg:col-span-4">
            <p className="text-xs font-semibold text-slate-700">
              Citizen Reward Bucket
            </p>

            <div className="relative mt-4 flex h-48 w-40 flex-col justify-end overflow-hidden rounded-b-3xl rounded-t-md border-2 border-slate-300 bg-white p-3">
              <div
                className="flex flex-wrap-reverse content-start justify-center gap-1.5 transition-all duration-300"
                aria-label={`${totalAwardedPoints} awarded points stacked inside reward bucket`}
              >
                {Array.from({length: coinCount}).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-500 bg-amber-400 font-mono text-[10px] font-bold text-amber-950 shadow-xs"
                  >
                    5
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-0 top-2 text-center font-mono text-[11px] font-semibold text-slate-400 tabular-nums">
                {progressPct}% of 100 pt Gold
              </div>
            </div>

            <p className="mt-3 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {totalAwardedPoints} pts
            </p>
            <p className="text-xs text-slate-500">
              {totalAwardedPoints >= 100
                ? 'Gold Milestone Reached'
                : `${nextMilestone.pointsRequired - totalAwardedPoints} pts to ${nextMilestone.title}`}
            </p>
          </div>

          <div className="space-y-5 lg:col-span-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Awarded Points</p>
                <p className="mt-1 font-mono text-2xl font-bold text-indigo-600 tabular-nums">
                  {totalAwardedPoints}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Pending Points</p>
                <p className="mt-1 font-mono text-2xl font-bold text-amber-700 tabular-nums">
                  {totalPendingPoints}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">
                  Total Potential (Awarded + Pending)
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                  {totalAwardedPoints + totalPendingPoints}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h2 className="font-display text-sm font-semibold text-slate-900">
                Transparent Demonstration Reward Rules
              </h2>
              <div className="mt-2.5 grid gap-3 text-xs text-slate-700 sm:grid-cols-3">
                <div className="rounded border border-slate-200 bg-white p-3">
                  <p className="font-mono font-bold text-indigo-600">
                    +{REWARD_RULES.VERIFIED_REPORT_POINTS} pts
                  </p>
                  <p className="mt-0.5 font-medium text-slate-900">
                    Verified Report
                  </p>
                  <p className="mt-0.5 text-slate-500">
                    Awarded once per unique submission.
                  </p>
                </div>
                <div className="rounded border border-slate-200 bg-white p-3">
                  <p className="font-mono font-bold text-indigo-600">
                    +{REWARD_RULES.UPVOTE_PARTICIPATION_POINTS} pts
                  </p>
                  <p className="mt-0.5 font-medium text-slate-900">
                    Upvote Support
                  </p>
                  <p className="mt-0.5 text-slate-500">
                    One-time participation credit per issue; toggling off and on cannot repeat.
                  </p>
                </div>
                <div className="rounded border border-slate-200 bg-white p-3">
                  <p className="font-mono font-bold text-indigo-600">
                    +{REWARD_RULES.RESOLUTION_CONFIRMATION_POINTS} pts
                  </p>
                  <p className="mt-0.5 font-medium text-slate-900">
                    Resolution Bonus
                  </p>
                  <p className="mt-0.5 text-slate-500">
                    Credited once closure is confirmed.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-sm font-semibold text-slate-900">
                Recognition Milestones &amp; Certificates
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {REWARD_MILESTONES.map((m) => {
                  const unlocked = totalAwardedPoints >= m.pointsRequired;
                  const pct = Math.min(
                    100,
                    Math.round((totalAwardedPoints / m.pointsRequired) * 100)
                  );
                  return (
                    <div
                      key={m.tier}
                      className={`rounded-lg border p-4 ${
                        unlocked
                          ? 'border-indigo-300 bg-indigo-50/50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                          <Award
                            className={`h-4 w-4 ${
                              unlocked ? 'text-indigo-600' : 'text-slate-400'
                            }`}
                          />
                          {m.tier.toUpperCase()}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                          {m.pointsRequired} pts
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs font-medium text-slate-800">
                        {m.title}
                      </p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full bg-indigo-600"
                          style={{width: `${pct}%`}}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setCertPreviewTier(m.tier)}
                        disabled={!unlocked}
                        className="mt-3 w-full min-h-9 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                      >
                        {unlocked ? 'View Certificate' : `Locked (${pct}%)`}
                      </button>
                    </div>
                  );
                })}
              </div>

              {totalAwardedPoints >= 100 && (
                <div className="flex items-start gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <span>
                    <strong>100-Point Civic Service Recognition:</strong> You have reached Gold Community Champion status. If your local urban body activates an authorised civic volunteer or nomination programme, an official eligibility link will appear here. Points never imply automatic government employment.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-lg border border-slate-200 bg-white p-6 lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-indigo-600" />
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Community Leaderboard
              </h2>
            </div>

            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setBoardScope('locality')}
                className={`min-h-8 rounded px-3 py-1 cursor-pointer ${
                  boardScope === 'locality'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Locality / Ward
              </button>
              <button
                type="button"
                onClick={() => setBoardScope('district')}
                className={`min-h-8 rounded px-3 py-1 cursor-pointer ${
                  boardScope === 'district'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                District (Bengaluru Urban)
              </button>
            </div>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Your rank:{' '}
            <span className="font-mono font-semibold text-slate-800">
              {userRank ? `#${userRank}` : 'Unranked'}
            </span>{' '}
            · Display respects your Profile privacy setting ({currentUser?.privacyDisplayPreference}).
          </p>

          <div className="mt-4 divide-y divide-slate-100">
            {filteredLeaderboard.map((entry, idx) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between gap-3 py-3 px-2 rounded ${
                  entry.isCurrentUser ? 'bg-indigo-50/70' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 font-mono text-xs font-bold text-slate-500 tabular-nums">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {entry.displayName}{' '}
                      {entry.isCurrentUser && (
                        <span className="text-xs font-medium text-indigo-600">
                          (You)
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {entry.ward} · {entry.resolvedCount} resolved
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold text-slate-900 tabular-nums shrink-0">
                  {entry.points} pts
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 lg:col-span-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Reward Activity History
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Deduplicated transaction ledger for your citizen account.
          </p>

          <div className="mt-4 max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {userTransactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No reward activity recorded yet.
              </p>
            ) : (
              userTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {tx.description}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">
                      {new Date(tx.createdAt).toLocaleString('en-IN')} ·{' '}
                      {tx.status === 'awarded' ? 'Awarded' : 'Pending confirmation'}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-sm font-bold tabular-nums shrink-0 ${
                      tx.status === 'awarded' ? 'text-indigo-600' : 'text-amber-700'
                    }`}
                  >
                    +{tx.points}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {activeCertMilestone && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Platform recognition certificate preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <p className="text-xs font-semibold text-indigo-600">
                  CitiSOLVE Platform Recognition (Demonstration)
                </p>
                <h3 className="mt-1 font-display text-xl font-bold text-slate-900">
                  {activeCertMilestone.title}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close certificate preview"
                onClick={() => setCertPreviewTier(null)}
                className="flex min-h-9 min-w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-5 rounded-lg border border-slate-200 bg-slate-50 p-5 text-center space-y-2">
              <CheckCircle2 className="mx-auto h-8 w-8 text-indigo-600" />
              <p className="text-xs text-slate-500">Presented to</p>
              <p className="font-display text-xl font-bold text-slate-900">
                {currentUser?.name}
              </p>
              <p className="text-xs text-slate-600">
                For achieving {activeCertMilestone.pointsRequired}+ civic participation points in{' '}
                {currentUser?.hierarchy.ward}.
              </p>
              <p className="pt-2 text-[11px] text-slate-500">
                Disclaimer: This is a platform demonstration recognition certificate and does not constitute an official municipal appointment or government employment offer.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCertPreviewTier(null)}
                className="min-h-10 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
