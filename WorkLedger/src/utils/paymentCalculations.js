export function getWorkedDays(startDate, endDate) {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return diffDays > 0 ? diffDays : 0;
}

// Returns the full payment breakdown for one work entry.
export function calculatePending(work) {
    const rate = Number(work.rate) || 0;
    const advancePay = Number(work.advancePay) || 0;
    const overtimePay = Number(work.overtimePay) || 0;
    const paymentsMade = Number(work.paymentsMade) || 0;

    const workedDays = getWorkedDays(work.workStartDate, work.workEndDate);

    // "daily" pay multiplies rate by days worked; "task" pay is a flat one-time amount.
    const baseAmount = work.paymentType === 'daily' ? rate * workedDays : rate;

    const totalOwed = baseAmount + overtimePay;
    const alreadyPaid = advancePay + paymentsMade;
    const pending = Math.max(totalOwed - alreadyPaid, 0);

    return { workedDays, baseAmount, totalOwed, alreadyPaid, pending };
}