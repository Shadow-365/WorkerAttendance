import { useState, useEffect } from 'react';
import { auth, db, rtdb } from './firebase/firebaseConfigs';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { ref, runTransaction, onValue, set, remove, push } from 'firebase/database';

import AddWorkForm from './AddWorkForm';
import WorkDetailsModal from './WorkDetailsModal';
import AttendanceModal from './AttendanceModal';

import styles from './styles/Dashboard.module.css';
import { calculatePending } from './utils/paymentCalculations';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [addWorkFormVisible, setAddWorkFormVisible] = useState(false);
    const [activeWorkerCount, setActiveWorkerCount] = useState(0);
    const [totalWorkerCount, setTotalWorkerCount] = useState(0);
    const [activeWorksList, setActiveWorksList] = useState([]); // This will hold the list of active workers
    const [selectedWorkId, setSelectedWorkId] = useState(null);
    const selectedWork = activeWorksList.find((w) => w.id === selectedWorkId) || null;
    const [selectedAttendanceWorkId, setSelectedAttendanceWorkId] = useState(null);
    const selectedAttendanceWork = activeWorksList.find((w) => w.id === selectedAttendanceWorkId) || null;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        const activeWorkerCountRef = ref(rtdb, 'activeWorkerCount');
        onValue(activeWorkerCountRef, async (snapshot) => {
            setActiveWorkerCount(snapshot.val() || 0);
        });

        const totalWorkerCountRef = ref(rtdb, 'totalWorkerCount');
        onValue(totalWorkerCountRef, (snapshot) => {
            setTotalWorkerCount(snapshot.val() || 0);
        });

        const activeWorksRef = ref(rtdb, 'activeWorks');
        onValue(activeWorksRef, (snapshot) => {
            const data = snapshot.val();
            const list = data
                ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
                : [];
            setActiveWorksList(list);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // This function fetches the user's role from Firestore based on their UID so that we can display the dashboard accordingly.
        async function fetchUserRole() {
            await getDocs(collection(db, "users")).then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    if (doc.data().uid === user?.uid) {
                        setRole(doc.data().role);
                    }
                });
            });
        }
        if (user) {
            fetchUserRole();
        }
    }, [user]);

    function showAddWorkForm() {
        setAddWorkFormVisible(true);
    }

    // Employer's total pending across all workers.
    const totalPendingAmount = activeWorksList.reduce(
        (sum, work) => sum + calculatePending(work).pending,
        0
    );

    const myActiveWorks = activeWorksList.filter((w) => w.workerEmail === user?.email);

    // This worker's own pending amount across their assigned works.
    const myPendingAmount = myActiveWorks.reduce(
        (sum, work) => sum + calculatePending(work).pending,
        0
    );

    // This worker's total earnings so far (advance + payments actually received).
    const myEarnings = myActiveWorks.reduce(
        (sum, work) => sum + calculatePending(work).alreadyPaid,
        0
    );

    const pendingConfirmations = myActiveWorks.flatMap((work) =>
        Object.entries(work.attendance || {})
            .filter(([date, record]) => record.confirmation === 'pending')
            .map(([date, record]) => ({
                workId: work.id,
                workName: work.workName,
                date,
                status: record.status,
            }))
    );

    const paymentHistory = myActiveWorks
        .flatMap((work) =>
            Object.entries(work.paymentHistory || {}).map(([id, record]) => ({
                id,
                workName: work.workName,
                amount: record.amount,
                timestamp: record.timestamp,
            }))
        )
        .sort((a, b) => b.timestamp - a.timestamp);

    function respondToAttendance(workId, date, decision) {
        const confirmationRef = ref(rtdb, `activeWorks/${workId}/attendance/${date}/confirmation`);
        set(confirmationRef, decision);
    }

    async function handleCompleteWork(work) {
        try {
            await remove(ref(rtdb, `activeWorks/${work.id}`));

            const activeWorkerCountRef = ref(rtdb, 'activeWorkerCount');
            await runTransaction(activeWorkerCountRef, (current) => Math.max((current || 0) - 1, 0));

            const activityLogRef = ref(rtdb, 'activityLog');
            await push(activityLogRef, {
                action: 'Work completed',
                workerName: work.workerName,
                message: `Marked work "${work.workName}" complete for ${work.workerName}`,
                timestamp: Date.now(),
            });
        } catch (error) {
            console.error('Failed to mark work complete:', error);
            alert('Something went wrong while completing the work.');
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Dashboard</h1>
                <p className={styles.subtitle}>
                    Signed in as {user?.email} <span className={styles.roleBadge}>{role}</span>
                </p>
            </div>

            <nav className={styles.nav}>
                <ul className={styles.navList}>
                    <li><a href="#">Home</a></li>
                    <li><a href="/activity-log">Activity Log</a></li>
                </ul>
            </nav>

            <div className={styles.content}>
                {role === "employer" ? (
                    <>
                        {addWorkFormVisible && <AddWorkForm setAddWorkFormVisible={setAddWorkFormVisible} />}
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>Workers</span>
                                <span className={styles.statValue}>{totalWorkerCount}</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>Active works</span>
                                <span className={styles.statValue}>{activeWorkerCount}</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>Pending Payments</span>
                                <span className={styles.statValue}>₹{totalPendingAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <h3 className={styles.sectionHeading}>List of currently active workers</h3>
                        <div className={styles.listCard}>
                            {activeWorkerCount !== 0 ? (
                                <ul className={styles.workerList}>
                                    {activeWorksList.map((work) => (
                                        <li key={work.id}>
                                            {work.workerName}
                                            <button className={styles.detailsButton} onClick={() => setSelectedWorkId(work.id)}>
                                                Payments & Details
                                            </button>
                                            <button className={styles.attendanceButton} onClick={() => setSelectedAttendanceWorkId(work.id)}>
                                                Attendance
                                            </button>
                                            <button className={styles.completeButton} onClick={() => handleCompleteWork(work)}>
                                                Mark Complete
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles.emptyState}>No active workers yet</p>
                            )}
                        </div>

                        <button className={styles.primaryButton} onClick={showAddWorkForm}>
                            Add new work
                        </button>
                    </>
                ) : (
                    <>
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>Earnings</span>
                                <span className={styles.statValue}>₹{myEarnings.toFixed(2)}</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>Pending Payments</span>
                                <span className={styles.statValue}>₹{myPendingAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <h3 className={styles.sectionHeading}>Pending Attendance Confirmations</h3>
                        <div className={styles.listCard}>
                            {pendingConfirmations.length === 0 ? (
                                <p className={styles.emptyState}>No pending attendance confirmations</p>
                            ) : (
                                <ul className={styles.workerList}>
                                    {pendingConfirmations.map((item) => (
                                        <li key={`${item.workId}-${item.date}`}>
                                            <span className={styles.workerName}>
                                                {item.workName} — {item.date} — marked <strong>{item.status}</strong>
                                            </span>
                                            <div className={styles.actionButtons}>
                                                <button className={styles.detailsButton} onClick={() => respondToAttendance(item.workId, item.date, 'approved')}>
                                                    Approve
                                                </button>
                                                <button className={styles.attendanceButton} onClick={() => respondToAttendance(item.workId, item.date, 'disputed')}>
                                                    Dispute
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <h3 className={styles.sectionHeading}>Your Payment History</h3>
                        <div className={styles.listCard}>
                            {paymentHistory.length === 0 ? (
                                <p className={styles.emptyState}>No payments recorded yet</p>
                            ) : (
                                <ul className={styles.workerList}>
                                    {paymentHistory.map((item) => (
                                        <li key={item.id}>
                                            <span className={styles.workerName}>
                                                {item.workName} — ₹{Number(item.amount).toFixed(2)}
                                            </span>
                                            <span className={styles.timestamp}>
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </>
                )}
            </div>
            {selectedWork && (
                <WorkDetailsModal work={selectedWork} onClose={() => setSelectedWorkId(null)} />
            )}
            {selectedAttendanceWork && (
                <AttendanceModal work={selectedAttendanceWork} onClose={() => setSelectedAttendanceWorkId(null)} />
            )}
        </div>
    );
}