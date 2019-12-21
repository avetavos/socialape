import { check } from 'express-validator';

const validator = [
	check('email')
		.not()
		.isEmpty()
		.trim()
		.withMessage('Email must not be empty.'),
	check('email')
		.isEmail()
		.trim()
		.withMessage('Must be a valid email address.'),
	check('password')
		.not()
		.isEmpty()
		.trim()
		.withMessage('Password must not be empty.'),
	check('password')
		.isLength({ min: 6 })
		.withMessage('Password should be at least 6 characters.')
];

export default validator;
