import { Request } from 'express';
import * as admin from 'firebase-admin';

export default interface RequestWithUser extends Request {
	user?: admin.auth.DecodedIdToken;
}
