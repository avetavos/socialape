import * as BusBoy from 'busboy';
import { Router } from 'express';
import { validationResult } from 'express-validator';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import AuthMiddleware from '../middlewares/authentication';
import UserDetailValidator from '../middlewares/validators/UserDetail.validator';
import { Admin, DB } from '../utils/Admin';
import { configs } from '../utils/Firebase';

export default class UserController {
	public router: Router = Router();
	private path: string = '/users';

	constructor() {
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.post(`${this.path}/image`, AuthMiddleware, this.uploadImage);
		this.router.post(this.path, AuthMiddleware, UserDetailValidator, this.storeUserDetails);
		this.router.get(this.path, AuthMiddleware, this.getAuthenticatedUser);
	}

	private uploadImage = async (req, res) => {
		try {
			const busboy = new BusBoy({ headers: req.headers });
			let imageFileName;
			let imageToBeUploaded = {
				filepath: '',
				mimetype: ''
			};
			await busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
				const imageExtension = filename.split('.')[filename.split('.').length - 1];
				imageFileName = `${Math.round(Math.random() * 1000000000000).toString()}.${imageExtension}`;
				const filepath = path.join(os.tmpdir(), imageFileName);
				imageToBeUploaded = { filepath, mimetype };
				file.pipe(fs.createWriteStream(filepath));
			});
			await busboy.on('finish', async () => {
				await Admin.storage()
					.bucket()
					.upload(imageToBeUploaded.filepath, {
						resumable: false,
						metadata: {
							metadata: {
								contentType: imageToBeUploaded.mimetype
							}
						}
					});
				const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${configs.storageBucket}/o/${imageFileName}?alt=media`;
				await DB.doc(`/users/${req.user.handle}`).update({ imageUrl });
				return res.json({ message: 'image uploaded successfully' });
			});
			busboy.end(req.rawBody);
		} catch (err) {
			return res.status(500).json(err);
		}
	};

	private storeUserDetails = async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		try {
			await DB.doc(`/users/${req.user.handle}`).update(req.body);
			return res.json({ message: 'Details added successfully.' });
		} catch (err) {
			return res.status(500).json(err);
		}
	};

	private getAuthenticatedUser = async (req, res) => {
		try {
			const userData = {
				credentials: {},
				likes: []
			};
			const user = await DB.doc(`/users/${req.user.handle}`).get();
			if (user.exists) {
				userData.credentials = user.data();
			}
			const likes = await DB.collection('likes')
				.where('userHandle', '==', req.user.handle)
				.get();
			likes.forEach(doc => {
				userData.likes.push(doc.data());
			});
			return res.json(userData);
		} catch (err) {
			return res.status(500).json(err);
		}
	};
}
