import express from 'express';
const router = express.Router();

import { authenticate } from '../../middlewares/authentication';
import { createEmployee, getEmployees, updateEmployee } from './employees.controller';
import validator from '../../middlewares/validator';
import {
  createEmployeeSchema,
  getEmployeesSchema,
  updateEmployeeSchema,
} from './employees.validators';

router.get('/employees', authenticate, validator(getEmployeesSchema, 'query'), getEmployees);
router.post('/employees', authenticate, validator(createEmployeeSchema), createEmployee);

router.put('/employees/:id', authenticate, validator(updateEmployeeSchema), updateEmployee);

export default router;
