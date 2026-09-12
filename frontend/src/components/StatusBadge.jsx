import React from 'react';

export default function StatusBadge({ status }) {
  const norm = (status || '').toLowerCase();

  let badgeClass = 'badge-secondary';
  let label = status;

  if (['critical', 'danger', 'failed'].includes(norm)) {
    badgeClass = 'badge-danger';
    label = norm === 'critical' ? 'Critical (90%+)' : status;
  } else if (['warning', 'pending', 'busy', 'in_transit', 'in_progress'].includes(norm)) {
    badgeClass = 'badge-warning';
    label = norm === 'in_transit' ? 'In Transit' : status;
  } else if (['completed', 'available', 'on_duty', 'normal', 'success'].includes(norm)) {
    badgeClass = 'badge-success';
    label = norm === 'on_duty' ? 'On Duty' : status;
  } else if (['assigned', 'info', 'scheduled'].includes(norm)) {
    badgeClass = 'badge-info';
    label = norm === 'assigned' ? 'Assigned' : status;
  }

  return (
    <span className={`badge-status ${badgeClass}`}>
      <span className="badge-status-dot" />
      <span>{label}</span>
    </span>
  );
}
