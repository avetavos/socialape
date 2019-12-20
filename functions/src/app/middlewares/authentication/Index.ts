import * as admin from 'firebase-admin';
import { DB } from '../../utils/Admin';

export default async (req, res, next) => {
	try {
		let idToken = '';
		if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
			idToken = await req.headers.authorization.split('Bearer ')[1];
		} else {
			return res.status(403).json({ error: 'Unauthorized' });
		}
		const decodedToken = await admin.auth().verifyIdToken(idToken);
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
