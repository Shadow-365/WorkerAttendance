import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { rtdb } from './firebase/firebaseConfigs';
import styles from './styles/AttendanceModal.module.css';

// Builds an array of "YYYY-MM-DD" strings from start to end, inclusive.
function getDateRange(start, end) {
    const dates = [];
    let current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

export default function AttendanceModal({ work, onClose }) {
    const [attendanceData, setAttendanceData] = useState({});

    const dateList = getDateRange(work.workStartDate, work.workEndDate);

    // Live-listen to this work's attendance so status/confirmation updates instantly.
    useEffect(() => {
        const attendanceRef = ref(rtdb, `activeWorks/₹{work.id}/attendance`);
        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            setAttendanceData(snapshot.val() || {});
        });
        return () => unsubscribe();
    }, [work.id]);

    function markAttendance(date, status) {
        const dateRef = ref(rtdb, `activeWorks/₹{work.id}/attendance/₹{date}`);
        set(dateRef, {
            status,               
            confirmation: 'pending',
            markedAt: Date.now(),
        });
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2>Attendance — {work.workerName}</h2>

                <div className={styles.dateList}>
                    {dateList.map((date) => {
                        const record = attendanceData[date];
                        const isPending = record?.confirmation === 'pending';

                        return (
                            <div key={date} className={styles.dateRow}>
                                <span className={styles.dateLabel}>{date}</span>

                                <div className={styles.buttonGroup}>
                                    <button
                                        className={record?.status === 'present' ? styles.presentActive : styles.presentButton}
                                        onClick={() => markAttendance(date, 'present')}
                                        disabled={isPending}
                                    >
                                        Present
                                    </button>
                                    <button
                                        className={record?.status === 'absent' ? styles.absentActive : styles.absentButton}
                                        onClick={() => markAttendance(date, 'absent')}
                                        disabled={isPending}
                                    >
                                        Absent
                                    </button>
                                </div>

                                <span className={styles.statusTag}>
                                    {!record && 'Not marked'}
                                    {record?.confirmation === 'pending' && 'Awaiting confirmation'}
                                    {record?.confirmation === 'approved' && '✓ Approved'}
                                    {record?.confirmation === 'disputed' && '⚠ Disputed'}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <button className={styles.closeButton} onClick={onClose}>Close</button>
            </div>
        </div>
    );
}