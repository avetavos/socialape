import { check } from 'express-validator';

const validator = [
	check('body', 'Scream body must not be empty.')
		.not()
		.isEmpty()
		.trim()
];

export default validator;
