import { Request, Response, Router } from 'express';
import { validationResult } from 'express-validator';
import RequestWithUser from '../interfaces/RequestWithUser.interface';
import Scream from '../interfaces/Scream.interface';
import AuthMiddleware from '../middlewares/authentication';
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
	}

	private createScream = async (req: RequestWithUser, res: Response) => {
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
			const doc: FirebaseFirestore.DocumentReference = await DB.collection('screams').add(
				newScream
			);
			return res.json({ message: `document ${doc.id} created successfully` });
		} catch (err) {
			return res.status(400).json(err);
		}
	};

	private getAllScreams = async (req: Request, res: Response) => {
		try {
			const data: FirebaseFirestore.QuerySnapshot = await DB.collection('screams')
				.orderBy('createdAt', 'desc')
				.get();
			const screams: Scream[] = [];
			await data.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
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
}
