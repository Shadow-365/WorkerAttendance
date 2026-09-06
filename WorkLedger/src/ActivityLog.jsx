import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "./firebase/firebaseConfigs";
import styles from "./styles/ActivityLog.module.css";

// Picks a color-coded dot based on the log entry's action, for quick scanning.
function getDotClass(action) {
    if (action === "Payment completed") return styles.dotCompleted;
    if (action === "Overtime added") return styles.dotOvertime;
    if (action === "Payment recorded") return styles.dotPayment;
    return styles.dot;
}

export default function ActivityLog() {
    const [activityLog, setActivityLog] = useState([]);

    useEffect(() => {
        const activityLogRef = ref(rtdb, 'activityLog');
        const unsubscribe = onValue(activityLogRef, (snapshot) => {
            const data = snapshot.val();
            const logList = data
                ? Object.entries(data)
                    .map(([id, entry]) => ({ id, ...entry }))
                    .sort((a, b) => b.timestamp - a.timestamp)
                : [];
            setActivityLog(logList);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Activity Log</h1>
                <a href="/dashboard" className={styles.backLink}>← Back to Dashboard</a>
            </div>

            {activityLog.length === 0 ? (
                <p className={styles.emptyState}>No activity yet</p>
            ) : (
                <ul className={styles.list}>
                    {activityLog.map((entry) => (
                        <li key={entry.id} className={styles.entry}>
                            <span className={`${styles.dot} ${getDotClass(entry.action)}`} />
                            <div className={styles.entryBody}>
                                <span className={styles.action}>{entry.action}</span>
                                <span className={styles.message}>{entry.message}</span>
                                <span className={styles.timestamp}>
                                    {new Date(entry.timestamp).toLocaleString()}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}