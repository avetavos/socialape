import { check } from 'express-validator';

const validator = [
	check('email', 'Email must not be empty.')
		.not()
		.isEmpty()
		.trim(),
	check('email', 'Must be a valid email address.')
		.isEmail()
		.trim(),
	check('password', 'Password must not be empty.')
		.not()
		.isEmpty()
		.trim(),
	check('password', 'Password should be at least 6 characters.').isLength({ min: 6 })
];

export default validator;
