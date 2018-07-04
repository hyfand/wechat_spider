# Motime --- mongoose timestamp plugin

Used to add createdAt and updatedAt for documents before save or update, support following mongoose operation:

- Document.save()
- Model.create()
- Model.insertMany()
- Model.findOneAndUpdate()
- Model.findByIdAndUpdate()
- Model.update()
- Model.updateMany()
- Model.updateOne()

## Install

```
npm install motime --save
```

## Usage

```javascript
const timePlugin = require('motime');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: String,
  email: String
});

UserSchema.plugin(timePlugin);
mongoose.model('User', UserSchema);
```

You can also change the field name easily:

```javascript
UserSchema.plugin(timePlugin, {
  createdAt: 'create_at',
  updatedAt: 'updated_at'
});
```

## License

MIT
