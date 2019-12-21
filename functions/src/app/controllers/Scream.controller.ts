import { Router } from 'express';
import { validationResult } from 'express-validator';
import AuthMiddleware from '../middlewares/authentication';
import CommentValidator from '../middlewares/validators/Comment.validator';
import ScreamValidator from '../middlewares/validators/Scream.validator';
import { DB } from '../utils/Admin';

export default class ScreamController {
	public router: Router = Router();
	private path: string = '/screams';

	constructor() {
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.post(this.path, AuthMiddleware, ScreamValidator, this.createScream);
		this.router.get(this.path, this.getAllScreams);
		this.router.get(`${this.path}/:screamId`, this.getScream);
		this.router.post(
			`${this.path}/:screamId/comment`,
			AuthMiddleware,
			CommentValidator,
			this.createCommentOnScream
		);
	}

	private createScream = async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		try {
			const newScream = {
				body: req.body.body,
				userHandle: req.user.handle,
				createdAt: new Date().toISOString()
			};
			const doc = await DB.collection('screams').add(newScream);
			return res.json({ message: `document ${doc.id} created successfully` });
		} catch (err) {
			return res.status(400).json(err);
		}
	};

	private getAllScreams = async (req, res) => {
		try {
			const data = await DB.collection('screams')
				.orderBy('createdAt', 'desc')
				.get();
			const screams = [];
			await data.forEach(doc => {
				screams.push({
					screamId: doc.id,
					body: doc.data().body,
					userHandle: doc.data().userHandle,
					createdAt: doc.data().createdAt
				});
			});
			return res.json(screams);
		} catch (err) {
			return res.status(400).json(err);
		}
	};

	private getScream = async (req, res) => {
		try {
			let screamData;
			const scream = await DB.doc(`/screams/${req.params.screamId}`).get();
			if (!scream) {
				return res.status(404).json({ errors: 'Scream not found!' });
			}
			screamData = await scream.data();
			screamData.screamId = scream.id;
			const comments = await DB.collection('comments')
				.orderBy('createdAt', 'asc')
				.where('screamId', '==', req.params.screamId)
				.get();
			screamData.comments = await [];
			comments.forEach(doc => {
				screamData.comments.push(doc.data());
			});
			return res.json(screamData);
		} catch (err) {
			return res.status(500).json(err);
		}
	};

	private createCommentOnScream = async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}
			const newComment = {
				body: req.body.body,
				createdAt: new Date().toISOString(),
				screamId: req.params.screamId,
				userHandle: req.user.handle,
				userImage: req.user.imageUrl
			};
			const scream = await DB.doc(`/screams/${req.params.screamId}`).get();
			if (!scream.exists) {
				return res.status(404).json({ errors: 'Scream not found!' });
			}
			await DB.collection('comments').add(newComment);
			return res.json(newComment);
		} catch (err) {
			return res.status(500).json(err);
		}
	};
}
