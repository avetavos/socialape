import { Request, Response, Router } from 'express';
import { validationResult } from 'express-validator';
import LoginValidator from '../middlewares/validators/Login.validator';
import SignUpValidator from '../middlewares/validators/SignUp.validator';
import { Admin, DB } from '../utils/Admin';
import { Firebase } from '../utils/Firebase';

export default class AuthenticationController {
	public router: Router = Router();
	private path: string = '/auth';

	constructor() {
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.post(`${this.path}/signup`, SignUpValidator, this.signUp);
		this.router.post(`${this.path}/login`, LoginValidator, this.login);
	}

	private signUp = async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const { email, password, handle } = req.body;
		try {
			const doc = await Admin.firestore()
				.doc(`/users/${handle}`)
				.get();
			if (doc.exists) {
				return res.status(400).json({ message: `this handle is already taken` });
			}

			const data: firebase.auth.UserCredential = await Firebase.auth().createUserWithEmailAndPassword(
				email,
				password
			);

			const token: string = await data.user.getIdToken();
			const userCredentials = {
				email,
				handle,
				userId: data.user.uid,
				createdAt: new Date().toISOString()
			};
			await DB.doc(`/users/${handle}`).set(userCredentials);
			return res.status(201).json({ token });
		} catch (err) {
			return res.status(400).json(err);
		}
	};

	private login = async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const { email, password } = req.body;
		try {
			const data: firebase.auth.UserCredential = await Firebase.auth().signInWithEmailAndPassword(
				email,
				password
			);
			const token: string = await data.user.getIdToken();
			return res.status(201).json({ token });
		} catch (err) {
			if (err.code === 'auth/wrong-password') {
				return res.status(403).json({ general: 'Wrong credentials, please try again.' });
			}
			return res.status(400).json(err);
		}
	};
}
