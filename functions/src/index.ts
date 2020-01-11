import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import * as functions from 'firebase-functions';

import Auth from './app/controllers/Authentication.controller';
import Scream from './app/controllers/Scream.controller';
import User from './app/controllers/User.controller';
import { DB } from './app/utils/Admin';

const app = express();
const controllers = [new Auth(), new Scream(), new User()];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());
app.use(cors());

controllers.forEach(controller => {
	app.use('/', controller.router);
});

export const api = functions.https.onRequest(app);
