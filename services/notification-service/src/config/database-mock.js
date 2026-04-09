import mongoose from 'mongoose';

// Mock database for development when MongoDB is not available
let mockData = {
  notifications: [],
  templates: []
};

const connectDB = async () => {
  try {
    // Try to connect to MongoDB first
    if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('localhost')) {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    }
    
    // Fallback to mock mode for development
    console.log('MongoDB not available - Running in mock mode for development');
    console.log('Mock database initialized with empty collections');
    
    // Create a proper mock implementation
    const createMockModel = (collectionName) => {
      return class MockModel {
        constructor(data) {
          this._id = Math.random().toString(36).substr(2, 9);
          Object.assign(this, data);
        }
        
        static async findOne(query) {
          const collection = collectionName === 'Notification' ? mockData.notifications : mockData.templates;
          
          if (collectionName === 'NotificationTemplate') {
            return collection.find(t => 
              t.eventType === query.eventType && 
              t.channel === query.channel && 
              t.isActive === true
            ) || null;
          }
          
          return collection.find(item => {
            for (let key in query) {
              if (item[key] !== query[key]) return false;
            }
            return true;
          }) || null;
        }
        
        static async findById(id) {
          const collection = collectionName === 'Notification' ? mockData.notifications : mockData.templates;
          return collection.find(item => item._id === id) || null;
        }
        
        static async find(query) {
          const collection = collectionName === 'Notification' ? mockData.notifications : mockData.templates;
          
          if (!query || Object.keys(query).length === 0) {
            return {
              sort: (sortObj) => ({
                limit: (limit) => ({
                  skip: (skip) => collection
                })
              })
            };
          }
          
          const filtered = collection.filter(item => {
            for (let key in query) {
              if (item[key] !== query[key]) return false;
            }
            return true;
          });
          
          return {
            sort: (sortObj) => ({
              limit: (limit) => ({
                skip: (skip) => filtered
              })
            })
          };
        }
        
        static async countDocuments(query) {
          const collection = collectionName === 'Notification' ? mockData.notifications : mockData.templates;
          
          if (!query || Object.keys(query).length === 0) {
            return collection.length;
          }
          
          return collection.filter(item => {
            for (let key in query) {
              if (item[key] !== query[key]) return false;
            }
            return true;
          }).length;
        }
        
        static async findByIdAndDelete(id) {
          const collection = collectionName === 'Notification' ? mockData.notifications : mockData.templates;
          const index = collection.findIndex(item => item._id === id);
          if (index > -1) {
            collection.splice(index, 1);
            return true;
          }
          return false;
        }
        
        static async create(data) {
          const item = new MockModel(data);
          const collection = collectionName === 'Notification' ? mockData.notifications : mockData.templates;
          collection.push(item);
          return item;
        }
        
        async save() {
          const collection = collectionName === 'Notification' ? mockData.notifications : mockData.templates;
          if (!collection.find(item => item._id === this._id)) {
            collection.push({ ...this });
          }
          return this;
        }
      };
    };
    
    // Mock mongoose methods
    mongoose.model = function(name, schema) {
      return createMockModel(name);
    };
    
    // Mock Schema constructor
    mongoose.Schema = function(schemaDefinition, options) {
      return schemaDefinition;
    };
    
    mongoose.connection = {
      on: () => {},
      close: async () => {}
    };

  } catch (error) {
    console.error('Error setting up database:', error.message);
    // Don't exit, allow service to run in mock mode
  }
};

export default connectDB;
