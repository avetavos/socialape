import * as firebase from 'firebase';

export const configs = {
	apiKey: 'AIzaSyB6cBEuFfOIaBNhHkMDqzqHiw5OeEug3n0',
	authDomain: 'socialape-7dfde.firebaseapp.com',
	databaseURL: 'https://socialape-7dfde.firebaseio.com',
	projectId: 'socialape-7dfde',
	storageBucket: 'socialape-7dfde.appspot.com',
	messagingSenderId: '837322561864',
	appId: '1:837322561864:web:7ef32c3ab6d295d43abb7d',
	measurementId: 'G-XDXSFGK1PK'
};

export const Firebase = firebase.initializeApp(configs);
