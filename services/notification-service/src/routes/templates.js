import { Router } from 'express';
import {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate
} from '../controllers/templateController.js';
import { validateRequest, createTemplateSchema, updateTemplateSchema } from '../middleware/validation.js';
import validateApiKey from '../middleware/auth.js';

const router = Router();

// POST /api/templates - Create a new template (protected)
router.post('/', validateApiKey, validateRequest(createTemplateSchema), createTemplate);

// GET /api/templates - Get all templates
router.get('/', getAllTemplates);

// GET /api/templates/:id - Get template by ID
router.get('/:id', getTemplateById);

// PUT /api/templates/:id - Update template (protected)
router.put('/:id', validateApiKey, validateRequest(updateTemplateSchema), updateTemplate);

// DELETE /api/templates/:id - Delete template (protected)
router.delete('/:id', validateApiKey, deleteTemplate);

export default router;
