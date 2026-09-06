import { useState } from 'react';
import { ref, runTransaction, push } from 'firebase/database';
import { rtdb } from './firebase/firebaseConfigs';
import styles from './styles/WorkDetailsModal.module.css';

export default function WorkDetailsModal({ work, onClose }) {
    const [paymentInput, setPaymentInput] = useState('');
    const [overtimeInput, setOvertimeInput] = useState('');

    if (!work) return null;

    const rate = Number(work.rate) || 0;
    const advancePay = Number(work.advancePay) || 0;
    const overtimePay = Number(work.overtimePay) || 0;
    const paymentsMade = Number(work.paymentsMade) || 0;

    const totalOwed = rate + overtimePay;
    const alreadyPaid = advancePay + paymentsMade;
    const pending = totalOwed - alreadyPaid;
    const isFullyPaid = pending <= 0;

    async function logActivity(action, message) {
        const activityLogRef = ref(rtdb, 'activityLog');
        await push(activityLogRef, {
            action,
            workerName: work.workerName,
            message,
            timestamp: Date.now(),
        });
    }

    async function handleAddPayment(e) {
        e.preventDefault();
        const amount = parseFloat(paymentInput);
        if (!amount || amount <= 0) return;

        const paymentsRef = ref(rtdb, `activeWorks/${work.id}/paymentsMade`);
        const result = await runTransaction(paymentsRef, (current) => (current || 0) + amount);
        setPaymentInput('');

        // Check whether this payment brought the total owed to fully paid.
        const newPaymentsMade = result.snapshot.val() || 0;
        const newAlreadyPaid = advancePay + newPaymentsMade;

        if (newAlreadyPaid >= totalOwed) {
            await logActivity(
                'Payment completed',
                `Full payment completed for "${work.workName}" — ${work.workerName}`
            );
        } else {
            await logActivity(
                'Payment recorded',
                `Recorded payment of ₹${amount.toFixed(2)} for "${work.workName}" — ${work.workerName}`
            );
        }
    }

    async function handleAddOvertime(e) {
        e.preventDefault();
        const amount = parseFloat(overtimeInput);
        if (!amount || amount <= 0) return;

        const overtimeRef = ref(rtdb, `activeWorks/${work.id}/overtimePay`);
        await runTransaction(overtimeRef, (current) => (current || 0) + amount);
        setOvertimeInput('');

        await logActivity(
            'Overtime added',
            `Added ₹${amount.toFixed(2)} overtime for "${work.workName}" — ${work.workerName}`
        );
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2>{work.workerName}</h2>
                <p className={styles.email}>{work.workerEmail}</p>

                <div className={styles.row}>
                    <span>Work</span>
                    <span>{work.workName}</span>
                </div>
                <div className={styles.row}>
                    <span>Rate ({work.paymentType})</span>
                    <span>₹{rate.toFixed(2)}</span>
                </div>
                <div className={styles.row}>
                    <span>Overtime pay</span>
                    <span>+₹{overtimePay.toFixed(2)}</span>
                </div>
                <div className={styles.row}>
                    <span>Advance paid</span>
                    <span>-₹{advancePay.toFixed(2)}</span>
                </div>
                <div className={styles.row}>
                    <span>Payments made</span>
                    <span>-₹{paymentsMade.toFixed(2)}</span>
                </div>

                <div className={styles.totalRow}>
                    <span>{isFullyPaid ? 'Fully paid' : 'Pending amount'}</span>
                    <span>₹{Math.max(pending, 0).toFixed(2)}</span>
                </div>

                {isFullyPaid ? (
                    <p className={styles.paidBadge}>✓ Payment complete</p>
                ) : (
                    <>
                        <form className={styles.inlineForm} onSubmit={handleAddPayment}>
                            <input
                                type="number"
                                placeholder="Enter payment amount"
                                value={paymentInput}
                                onChange={(e) => setPaymentInput(e.target.value)}
                            />
                            <button type="submit">Record Payment</button>
                        </form>

                        <form className={styles.inlineForm} onSubmit={handleAddOvertime}>
                            <input
                                type="number"
                                placeholder="Enter overtime amount"
                                value={overtimeInput}
                                onChange={(e) => setOvertimeInput(e.target.value)}
                            />
                            <button type="submit">Add Overtime</button>
                        </form>
                    </>
                )}

                <button className={styles.closeButton} onClick={onClose}>Close</button>
            </div>
        </div>
    );
}