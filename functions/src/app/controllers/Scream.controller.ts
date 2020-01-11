import { Router } from 'express';
import { validationResult } from 'express-validator';
import { v4 as uuid } from 'uuid';
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
		this.router.delete(
			`${this.path}/:screamId/comment/:commentId`,
			AuthMiddleware,
			this.deleteCommentOnScream
		);
		this.router.post(`${this.path}/:screamId/like`, AuthMiddleware, this.likeOnScream);
		this.router.delete(`${this.path}/:screamId/unlike`, AuthMiddleware, this.unlikeOnScream);
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
				createdAt: new Date().toISOString(),
				comments: [],
				likes: []
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
					id: doc.id,
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
			screamData.id = scream.id;
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
			const scream = await DB.doc(`screams/${req.params.screamId}`).get();
			if (!scream.exists) {
				return res.status(404).json({ errors: 'Scream not found!' });
			}
			const commentScream = scream.data();
			const newComment = {
				id: uuid(),
				body: req.body.body,
				createdAt: new Date().toISOString(),
				userHandle: req.user.handle
			};
			commentScream.comments.push(newComment);
			await DB.doc(`/screams/${req.params.screamId}`).set(commentScream);
			return res.json(commentScream);
		} catch (err) {
			return res.status(500).json(err);
		}
	};

	private deleteCommentOnScream = async (req, res) => {
		try {
			const scream = await DB.doc(`screams/${req.params.screamId}`).get();
			if (!scream.exists) {
				return res.status(404).json({ errors: 'Scream not found!' });
			}
			const uncommentScream = scream.data();
			const removeIndex = uncommentScream.comments
				.map(comment => comment.id.toString())
				.indexOf(req.params.commentId);
			if (removeIndex > 0) {
				return res.status(404).json({ errors: 'Comment not found!' });
			}
			if (uncommentScream.comments[removeIndex].userHandle !== req.user.handle) {
				return res.status(403).json({ errors: 'Unauthorized' });
			}
			uncommentScream.comments.splice(removeIndex, 1);
			await DB.doc(`/screams/${req.params.screamId}`).set(uncommentScream);
			return res.json(uncommentScream);
		} catch (err) {
			return res.status(500).json(err);
		}
	};

	private likeOnScream = async (req, res) => {
		try {
			const scream = await DB.doc(`screams/${req.params.screamId}`).get();
			if (!scream.exists) {
				return res.status(404).json({ errors: 'Scream not found!' });
			}
			const likeScream = scream.data();
			if (
				likeScream.likes.filter(like => like.userHandle.toString() === req.user.handle.toString())
					.length > 0
			) {
				return res.status(400).json({ msg: 'Scream already liked' });
			}
			likeScream.likes.unshift({ userHandle: req.user.handle.toString() });
			await DB.doc(`/screams/${req.params.screamId}`).set(likeScream);
			return res.json(likeScream);
		} catch (err) {
			return res.status(500).json(err);
		}
	};

	private unlikeOnScream = async (req, res) => {
		try {
			const scream = await DB.doc(`screams/${req.params.screamId}`).get();
			if (!scream.exists) {
				return res.status(404).json({ errors: 'Scream not found!' });
			}
			const unlikeScream = scream.data();
			const removeIndex = unlikeScream.likes
				.map(like => like.userHandle.toString())
				.indexOf(req.user.handle.toString());
			if (removeIndex > 0) {
				return res.status(404).json({ errors: 'User not like yet!' });
			}
			unlikeScream.likes.splice(removeIndex, 1);
			await DB.doc(`/screams/${req.params.screamId}`).set(unlikeScream);
			return res.json(unlikeScream);
		} catch (err) {
			return res.status(500).json(err);
		}
	};
}
