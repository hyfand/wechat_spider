'use strict';

class TimePlugin {

  constructor(schema, options = {}) {
    this.schema = schema;
    this.createdAt = options.createdAt || 'createdAt';
    this.updatedAt = options.updatedAt || 'updatedAt';

    this.init();
  }

  init() {
    this.validateField(this.schema.path(this.createdAt), this.createdAt);
    this.validateField(this.schema.path(this.updatedAt), this.createdAt);
    
    // add createdAt and updatedAt fields
    this.schema.add({ [this.createdAt]: Date });
    this.schema.add({ [this.updatedAt]: Date });
  }

  // validate createdAt or updatedAt field's type, make sure is Date
  validateField(schemaType, fieldName) {
    if (schemaType && typeof schemaType === 'object' && schemaType.instance !== 'Date') {
      throw new Error(`you should change ${fieldName}'s field name or type`);
    }
  }

  save() {
    const { createdAt, updatedAt } = this;
    this.schema.pre('save', function(next) {
      if (this.isNew) {
        this[updatedAt] = this[createdAt] = new Date();
      } else if (this.isModified()) {
        this[updatedAt] = new Date();
      }
      next();
    });
  }

  findOneAndUpdate() {
    this.schema.pre('findOneAndUpdate', this._update());
  }

  update() {
    this.schema.pre('update', this._update());
  }

  updateOne() {
    this.schema.pre('updateOne', this._update());
  }

  updateMany() {
    this.schema.pre('updateMany', this._update());
  }

  _update() {
    const { createdAt, updatedAt } = this;
    return function(next) {
      const now = new Date();
      this.update({}, {
        $set: { [updatedAt]: now },
        $setOnInsert: { [createdAt]: now }
      });
      next();
    };
  }

  insertMany() {
    const { createdAt, updatedAt } = this;
    this.schema.pre('insertMany', function(next, docs) {
      const now = new Date();
      docs.forEach(doc => {
        doc[createdAt] = now;
        doc[updatedAt] = now;
      });
      next();
    });
  }
}

/**
 * mongoose time plugin function add createdAt and updatedAt to documents
 * 
 * @param {Schema} schema 
 * @param {Object} [options] 
 * @param {String} [options.createdAt]
 * @param {String} [options.updatedAt]
 */

module.exports = function timePlugin(schema, options) {
  const plugin = new TimePlugin(schema, options);
  plugin.save();
  plugin.findOneAndUpdate();
  plugin.update();
  plugin.updateOne();
  plugin.updateMany();
  plugin.insertMany();
};
