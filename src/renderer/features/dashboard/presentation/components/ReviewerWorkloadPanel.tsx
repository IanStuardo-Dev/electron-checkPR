import React from 'react';
import type { ReviewerInsight } from '../../../../shared/dashboard/summary.types';

const ReviewerWorkloadPanel = ({ reviewers }: { reviewers: ReviewerInsight[] }) => (
  <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Reviewer workload</h2>
        <p className="mt-1 text-sm text-slate-500">Carga pendiente por reviewer en la cola actual.</p>
      </div>
    </div>
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {reviewers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500 xl:col-span-4">
          Sin reviewers pendientes todavía.
        </div>
      ) : (
        reviewers.map((reviewer) => (
          <div key={reviewer.reviewer} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm font-medium text-slate-900">{reviewer.reviewer}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{reviewer.pending}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">pendientes</p>
          </div>
        ))
      )}
    </div>
  </section>
);

export default ReviewerWorkloadPanel;
