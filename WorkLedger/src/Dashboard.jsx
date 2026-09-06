import { useState, useEffect } from 'react';
import { auth, db, rtdb } from './firebase/firebaseConfigs';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { ref, runTransaction, onValue, set } from 'firebase/database';

import AddWorkForm from './AddWorkForm';
import WorkDetailsModal from './WorkDetailsModal';
import AttendanceModal from './AttendanceModal';

import styles from './styles/Dashboard.module.css';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [addWorkFormVisible, setAddWorkFormVisible] = useState(false);
    const [activeWorkerCount, setActiveWorkerCount] = useState(0);
    const [totalWorkerCount, setTotalWorkerCount] = useState(0);
    const [activeWorksList, setActiveWorksList] = useState([]); // This will hold the list of active workers
    // const [selectedWork, setSelectedWork] = useState(null);
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
        // This function will be used to show a form for adding new work.
        setAddWorkFormVisible(true);

    }

    const totalPendingAmount = activeWorksList.reduce((sum, work) => {
        const rate = Number(work.rate) || 0;
        const advancePay = Number(work.advancePay) || 0;
        const overtimePay = Number(work.overtimePay) || 0;
        const paymentsMade = Number(work.paymentsMade) || 0;

        const totalOwed = rate + overtimePay;
        const alreadyPaid = advancePay + paymentsMade;
        const pending = Math.max(totalOwed - alreadyPaid, 0);

        return sum + pending;
    }, 0);

    const myActiveWorks = activeWorksList.filter((w) => w.workerEmail === user?.email);

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

    function respondToAttendance(workId, date, decision) {
        const confirmationRef = ref(rtdb, `activeWorks/₹{workId}/attendance/₹{date}/confirmation`);
        set(confirmationRef, decision);
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
                            {/* <p className={styles.emptyState}>No active workers yet</p> */}
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
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles.emptyState}>No active workers yet</p>
                            )}
                        </div>

                        <button className={styles.primaryButton}
                            onClick={showAddWorkForm}
                        >Add new work</button>
                    </>
                ) : (
                    <>
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>Workers</span>
                                <span className={styles.statValue}>0</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>Active works</span>
                                <span className={styles.statValue}>0</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>Pending Payments</span>
                                <span className={styles.statValue}>₹0.00</span>
                            </div>
                        </div>

                        <h3 className={styles.sectionHeading}>Your active work</h3>
                        <div className={styles.listCard}>
                            {pendingConfirmations.length === 0 ? (
                                <p className={styles.emptyState}>No pending attendance confirmations</p>
                            ) : (
                                <ul className={styles.workerList}>
                                    {pendingConfirmations.map((item) => (
                                        <li key={`₹{item.workId}-₹{item.date}`}>
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
                    </>
                )}
            </div>
            {selectedWork && (
                <WorkDetailsModal work={selectedWork} onClose={() => setSelectedWorkId(null)} />
            )}
            {selectedAttendanceWork && (
                <AttendanceModal work={selectedAttendanceWork} onClose={() => setSelectedAttendanceWorkId(null)} />
            )}
        </div>)
}