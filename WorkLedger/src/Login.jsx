import { useState } from 'react';
import { db, auth } from './firebase/firebaseConfigs';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

import styles from './styles/Login.module.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentLoginState, setCurrentLoginState] = useState('login'); // 'login' or 'register'
    const [role, setRole] = useState('worker'); // 'worker' or 'employer'


     function proceedAuth() {
        if (currentLoginState === 'login') {
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Signed in 
                    const user = userCredential.user;
                    console.log('Logged in:', user);
                })
                .catch((error) => {
                    alert(`Login error: ${error.message}`);
                });
        } else {
            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }
            createUserWithEmailAndPassword(auth, email, password)
                .then(async(userCredential) => {
                    // Signed up
                    const user = userCredential.user;
                    console.log('User created:', user);
                    // Add user role to Firestore
                    await addDoc(collection(db, "users"), {
                        uid: user.uid,
                        role: role
                    })
                })
                .catch((error) => {
                    alert(`Registration error: ${error.message}`);
                });
        }
    }

    return (
        <div className={styles.parentContainer}>

            <div className={styles.loginSignupContainer}>
                <div onClick={() => {
                    setCurrentLoginState("login");
                    setEmail("");
                    setPassword("");
                    setConfirmPassword("");
                }}
                    className={currentLoginState === "login" ? styles.active : ""}>
                    Login
                </div>
                <div onClick={() => {
                    setCurrentLoginState("register");
                    setEmail("");
                    setPassword("");
                    setConfirmPassword("");
                    setRole("worker");
                }}
                    className={currentLoginState === "register" ? styles.active : ""}>
                    Register
                </div>
            </div>

            <div className={styles.inputContainer}>
                {
                    currentLoginState === 'login' ? (
                        <div>
                            <h3 style={{ textAlign: "center" }}>Login</h3>
                            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    ) : (
                        <div>
                            <h3 style={{ textAlign: "center" }}>Register</h3>
                            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            <select
                                className={styles.roleSelect}
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="worker">Worker</option>
                                <option value="employer">Employer</option>
                            </select>
                        </div>
                    )
                }
            </div>
            <button onClick={proceedAuth}>PROCEED</button>
        </div>
    )
}