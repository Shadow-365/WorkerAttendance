import { useState } from 'react';
import { db, auth } from './firebase/firebaseConfigs';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function App() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	function handleEmailChange(e) {
		setEmail(e.target.value);
	}

	return (
		<div>
			<h1>Worker Attendance</h1>
		</div>
	)
}