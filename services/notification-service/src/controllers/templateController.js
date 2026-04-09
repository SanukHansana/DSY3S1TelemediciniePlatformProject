import NotificationTemplate from '../models/NotificationTemplate.js';

const createTemplate = async (req, res) => {
  try {
    const { eventType, channel, subject, bodyTemplate, description } = req.body;

    if (!eventType || !channel || !bodyTemplate) {
      return res.status(400).json({
        success: false,
        message: 'eventType, channel, and bodyTemplate are required'
      });
    }

    const existingTemplate = await NotificationTemplate.findOne({
      eventType,
      channel
    });

    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: `Template already exists for ${eventType} via ${channel}`
      });
    }

    const template = new NotificationTemplate({
      eventType,
      channel,
      subject,
      bodyTemplate,
      description
    });

    await template.save();

    return res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getAllTemplates = async (req, res) => {
  try {
    const { eventType, channel, isActive } = req.query;

    const query = {};
    if (eventType) query.eventType = eventType;
    if (channel) query.channel = channel;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const templates = await NotificationTemplate.find(query);
    
    // Sort the templates
    templates.sort((a, b) => {
      if (a.eventType !== b.eventType) {
        return a.eventType.localeCompare(b.eventType);
      }
      return a.channel.localeCompare(b.channel);
    });

    return res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await NotificationTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    return res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, bodyTemplate, isActive, description } = req.body;

    const template = await NotificationTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    if (subject !== undefined) template.subject = subject;
    if (bodyTemplate !== undefined) template.bodyTemplate = bodyTemplate;
    if (isActive !== undefined) template.isActive = isActive;
    if (description !== undefined) template.description = description;

    await template.save();

    return res.json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await NotificationTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    await NotificationTemplate.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate
};