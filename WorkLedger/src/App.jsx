import { useState } from 'react';
import { db, auth } from './firebase/firebaseConfigs';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

import Login from './Login';

export default function App() {
	

	return (
		<div>
			<h1>Workers Attendance</h1>
			<Login />
		</div>
	)
}