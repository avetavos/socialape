import { check } from 'express-validator';

const validator = [
	check('body')
		.not()
		.isEmpty()
		.trim()
		.withMessage('Comment must not be empty.')
];

export default validator;
