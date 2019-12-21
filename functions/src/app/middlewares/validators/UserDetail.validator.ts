import { check } from 'express-validator';

const validator = [
	check('bio')
		.not()
		.isEmpty()
		.trim()
		.withMessage('Bio is required.'),
	check('website')
		.not()
		.isEmpty()
		.trim()
		.withMessage('Website is required.'),
	check('location')
		.not()
		.isEmpty()
		.trim()
		.withMessage('Location is required.')
];

export default validator;
