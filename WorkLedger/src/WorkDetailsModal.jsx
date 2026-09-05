import { useState } from 'react';
import { ref, runTransaction } from 'firebase/database';
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

    async function handleAddPayment(e) {
        e.preventDefault();
        const amount = parseFloat(paymentInput);
        if (!amount || amount <= 0) return;

        const paymentsRef = ref(rtdb, `activeWorks/${work.id}/paymentsMade`);
        await runTransaction(paymentsRef, (current) => (current || 0) + amount);
        setPaymentInput('');
    }

    async function handleAddOvertime(e) {
        e.preventDefault();
        const amount = parseFloat(overtimeInput);
        if (!amount || amount <= 0) return;

        const overtimeRef = ref(rtdb, `activeWorks/${work.id}/overtimePay`);
        await runTransaction(overtimeRef, (current) => (current || 0) + amount);
        setOvertimeInput('');
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
                    <span>${rate.toFixed(2)}</span>
                </div>
                <div className={styles.row}>
                    <span>Overtime pay</span>
                    <span>+${overtimePay.toFixed(2)}</span>
                </div>
                <div className={styles.row}>
                    <span>Advance paid</span>
                    <span>-${advancePay.toFixed(2)}</span>
                </div>
                <div className={styles.row}>
                    <span>Payments made</span>
                    <span>-${paymentsMade.toFixed(2)}</span>
                </div>

                <div className={styles.totalRow}>
                    <span>{isFullyPaid ? 'Fully paid' : 'Pending amount'}</span>
                    <span>${Math.max(pending, 0).toFixed(2)}</span>
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