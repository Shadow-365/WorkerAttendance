import { auth, db, rtdb } from './firebase/firebaseConfigs';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, set, get, runTransaction, push } from 'firebase/database';
import { useState } from 'react';
import styles from './styles/AddWorkForm.module.css';

export default function AddWorkForm({ setAddWorkFormVisible }) {
    const [workerEmail, setWorkerEmail] = useState('');
    const [workName, setWorkName] = useState('');
    const [workDescription, setWorkDescription] = useState('');
    const [workLocation, setWorkLocation] = useState('');
    const [workStartDate, setWorkStartDate] = useState('');
    const [workEndDate, setWorkEndDate] = useState('');
    const [rate, setRate] = useState("");
    const [paymentType, setPaymentType] = useState('daily');
    const [advancedPayment, setAdvancedPayment] = useState(""); 

    async function handleSubmit(e) {
        e.preventDefault();

        
        const usersQuery = query(collection(db, 'users'), where('email', '==', workerEmail));
        const querySnapshot = await getDocs(usersQuery);

        if (querySnapshot.empty) {
            alert('No worker found with that email.');
            return;
        }

        const workerName = querySnapshot.docs[0].data().name;

        try {
            const activeWorksRef = ref(rtdb, 'activeWorks');
            await push(activeWorksRef, {
                workerEmail,
                workerName,
                workName,
                workLocation,
                rate,
                paymentType,
                createdAt: Date.now(),
                workStartDate,        
                workEndDate,      
                description: workDescription,
                advancePay: advancedPayment,
            });

            const activeWorkerCountRef = ref(rtdb, 'activeWorkerCount');
            await runTransaction(activeWorkerCountRef, (currentValue) => (currentValue || 0) + 1);
        } catch (error) {
            console.error('Failed to add work:', error);
            alert('Something went wrong while adding the work.');
            return;
        }

        setAddWorkFormVisible(false);
    }

    return (
        <div className={styles.overlay} onClick={() => setAddWorkFormVisible(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2>Add New Work</h2>
                <form onSubmit={handleSubmit}>
                    <label className={styles.formGroup}>
                        Worker Email:
                        <input type="email" value={workerEmail} onChange={(e) => setWorkerEmail(e.target.value)} />
                    </label>
                    <label className={styles.formGroup}>
                        Work Name:
                        <input type="text" value={workName} onChange={(e) => setWorkName(e.target.value)} />
                    </label>
                    <label className={styles.formGroup}>
                        Work Description:
                        <textarea value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} />
                    </label>
                    <label className={styles.formGroup}>
                        Work Location:
                        <input type="text" value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} />
                    </label>

                    <div className={styles.dateRow}>
                        <label className={styles.formGroup}>
                            Start Date:
                            <input type="date" value={workStartDate} onChange={(e) => setWorkStartDate(e.target.value)} />
                        </label>
                        <label className={styles.formGroup}>
                            End Date:
                            <input type="date" value={workEndDate} onChange={(e) => setWorkEndDate(e.target.value)} />
                        </label>
                    </div>

                    <label className={styles.formGroup}>
                        Rate:
                        <input
                            type="number"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                        />
                    </label>
                    <label className={styles.formGroup}>
                        Advanced Payment:
                        <input
                            type="number"
                            value={advancedPayment}
                            onChange={(e) => setAdvancedPayment(e.target.value)}
                        />
                    </label>
                    <label className={styles.formGroup}>
                        Payment Type:
                        <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                            <option value="daily">Daily</option>
                            <option value="task">Task</option>
                        </select>
                    </label>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelButton} onClick={() => setAddWorkFormVisible(false)}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitButton}>
                            Add Work
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}