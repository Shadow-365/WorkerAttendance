import { Routes, Route, BrowserRouter, Link } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import ActivityLog from './ActivityLog';
import styles from './styles/App.module.css';

function Home() {
    return (
        <div className={styles.mainBody}>

            <header className={styles.hero}>
                <h1>Infinite WorkLedger</h1>

                <h2>
                    Keep Work, Attendance & Payments Clearly Recorded.
                </h2>

                <p>
                    A shared digital record for temporary and wage workers
                    and their employers.
                </p>

                <div className={styles.buttonGroup}>

                    <Link to="/login">
                        <button
                            className={`${styles.button} ${styles.primary}`}
                        >
                            Get Started
                        </button>
                    </Link>

                  

                </div>
            </header>

            <section className={styles.card}>
                <ul className={styles.featureList}>

                    <li>
                        <span className={styles.check}>✓</span>
                        Work Record
                    </li>

                    <li>
                        <span className={styles.check}>✓</span>
                        Attendance
                    </li>

                    <li>
                        <span className={styles.check}>✓</span>
                        Payment Tracking
                    </li>

                    <li>
                        <span className={styles.check}>✓</span>
                        Activity Logs
                    </li>

                </ul>
            </section>

        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/" element={<Home />} />

                <Route path="/login" element={<Login />} />

                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/activity-log" element={<ActivityLog />} />

            </Routes>
        </BrowserRouter>
    );
}