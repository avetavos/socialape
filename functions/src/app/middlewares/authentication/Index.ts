import { NextFunction, Response } from 'express';
import * as admin from 'firebase-admin';
import RequestWithUser from '../../interfaces/RequestWithUser.interface';
import { DB } from '../../utils/Admin';

export default async (req: RequestWithUser, res: Response, next: NextFunction) => {
	try {
		let idToken: string = '';
		if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
			idToken = await req.headers.authorization.split('Bearer ')[1];
		} else {
			return res.status(403).json({ error: 'Unauthorized' });
		}
		const decodedToken: admin.auth.DecodedIdToken = await admin.auth().verifyIdToken(idToken);
		req.user = decodedToken;
		const data = await DB.collection('users')
			.where('userId', '==', req.user.uid)
			.limit(1)
			.get();
		req.user.handle = await data.docs[0].data().handle;
		return next();
	} catch (err) {
		return res.status(403).json(err);
	}
};
