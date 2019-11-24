import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as express from 'express';
import * as functions from 'firebase-functions';

import Auth from './app/controllers/Authentication.controller';
import Scream from './app/controllers/Scream.controller';

const app: express.Application = express();
const controllers = [new Auth(), new Scream()];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());

controllers.forEach(controller => {
	app.use('/', controller.router);
});

export const api = functions.https.onRequest(app);
