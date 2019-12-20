import * as BusBoy from 'busboy';
import { Router } from 'express';
import { validationResult } from 'express-validator';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import AuthMiddleware from '../middlewares/authentication';
import LoginValidator from '../middlewares/validators/Login.validator';
import SignUpValidator from '../middlewares/validators/SignUp.validator';
import { Admin, DB } from '../utils/Admin';
import { Firebase, configs } from '../utils/Firebase';

export default class AuthenticationController {
	public router: Router = Router();
	private path: string = '/auth';

	constructor() {
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.post(`${this.path}/signup`, SignUpValidator, this.signUp);
		this.router.post(`${this.path}/login`, LoginValidator, this.login);
		this.router.post(`${this.path}/user/image`, AuthMiddleware, this.uploadImage);
	}

	private signUp = async (req, res) => {
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

			const data = await Firebase.auth().createUserWithEmailAndPassword(email, password);

			const token = await data.user.getIdToken();
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

	private login = async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const { email, password } = req.body;
		try {
			const data = await Firebase.auth().signInWithEmailAndPassword(email, password);
			const token = await data.user.getIdToken();
			return res.status(201).json({ token });
		} catch (err) {
			if (err.code === 'auth/wrong-password') {
				return res.status(403).json({ general: 'Wrong credentials, please try again.' });
			}
			return res.status(400).json(err);
		}
	};

	private uploadImage = async (req, res) => {
		const busboy = new BusBoy({ headers: req.headers });
		let imageFileName;
		let imageToBeUploaded = {
			filepath: '',
			mimetype: ''
		};
		busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
			const imageExtension = filename.split('.')[filename.split('.').length - 1];
			imageFileName = `${Math.round(Math.random() * 1000000000000).toString()}.${imageExtension}`;
			const filepath = path.join(os.tmpdir(), imageFileName);
			imageToBeUploaded = { filepath, mimetype };
			file.pipe(fs.createWriteStream(filepath));
		});
		busboy.on('finish', () => {
			Admin.storage()
				.bucket()
				.upload(imageToBeUploaded.filepath, {
					resumable: false,
					metadata: {
						metadata: {
							contentType: imageToBeUploaded.mimetype
						}
					}
				})
				.then(() => {
					const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${configs.storageBucket}/o/${imageFileName}?alt=media`;
					return DB.doc(`/users/${req.user.handle}`).update({ imageUrl });
				})
				.then(() => {
					return res.json({ message: 'image uploaded successfully' });
				})
				.catch(err => {
					return res.status(500).json({ error: 'something went wrong' });
				});
		});
		busboy.end(req.rawBody);
	};
}
