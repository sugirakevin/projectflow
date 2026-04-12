/**
 * Calculates overdue status based on deadline and task statuses.
 * Returns { overdueFlag, overdueTeam, isClosed }
 */
function calculateOverdue(deadline, devStatus, testStatus) {
  const now = new Date();
  const due = new Date(deadline);

  // Case 4: Dev Completed + Test Passed => Closed
  if (devStatus === 'COMPLETED' && testStatus === 'PASSED') {
    return { overdueFlag: false, overdueTeam: null, isClosed: true };
  }

  // Case 1: Not yet past deadline
  if (now <= due) {
    return { overdueFlag: false, overdueTeam: null, isClosed: false };
  }

  // Past deadline from here...

  // Case 2: Dev not completed => Dev team overdue
  if (devStatus !== 'COMPLETED') {
    return { overdueFlag: true, overdueTeam: 'Dev', isClosed: false };
  }

  // Case 3: Dev completed but test not passed => Testing team overdue
  return { overdueFlag: true, overdueTeam: 'Testing', isClosed: false };
}

module.exports = { calculateOverdue };
