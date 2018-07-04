'use strict';

let mongoose = require('mongoose');
const Schema = mongoose.Schema;
const assert = require('assert');
const timePlugin = require('../');

mongoose = mongoose.createConnection('mongodb://localhost/mongoosetime');

const UserSchema = new Schema({
  name: String,
  email: String
});
UserSchema.plugin(timePlugin, {
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
const User = mongoose.model('User', UserSchema);

function sleep() {
  return new Promise(resolve => {
    setTimeout(resolve, 1);
  });
}

after(function () {
  mongoose.close();
});

describe('customize fields\' name: save hook', function () {

  afterEach(async function () {
    await User.remove({});
  });

  it('the doc should have created_at and updated_at', async function () {
    const user = new User({ name: 'liqiang', email: '974923609@qq.com' });
    await user.save();
    const savedUser = await User.findById(user._id);
    const { created_at, updated_at } = savedUser;
    assert(created_at instanceof Date && updated_at instanceof Date);
  });

  it('when new, created_at should equal updated_at', async function () {
    const user = new User({ name: 'liqiang', email: '974923609@qq.com' });
    await user.save();
    const savedUser = await User.findById(user._id);
    const { created_at, updated_at } = savedUser;
    assert(created_at - updated_at === 0);
  });

  it('when modify, created_at should less than updated_at', async function () {
    const user = new User({ name: 'liqiang', email: '974923609@qq.com' });
    await user.save();
    user.name = 'lq';
    await sleep();
    await user.save();
    const savedUser = await User.findById(user._id);
    const { created_at, updated_at } = savedUser;
    assert(updated_at - created_at > 0);
  });

  it('use Model.create()', async function () {
    const user = await User.create({ name: 'liqiang', email: '974923609@qq.com' });
    const { created_at, updated_at } = user;
    assert(created_at - updated_at === 0);
  });
});

describe('customize fields\' name: findOneAndUpdate hook', async function () {

  afterEach(async function () {
    await User.remove({});
  });

  it('created_at should less than updated_at', async function () {
    await User.create({ name: 'liqiang', email: '974923609@qq.com' });
    await sleep();
    const user = await User.findOneAndUpdate(
      { name: 'liqiang' },
      { name: 'lq' },
      { new: true }
    );
    const { created_at, updated_at } = user;
    assert(updated_at - created_at > 0);
  });

  it('when use $set', async function () {
    await User.create({ name: 'liqiang', email: '974923609@qq.com' });
    await sleep();
    const user = await User.findOneAndUpdate(
      { name: 'liqiang' },
      { $set: { name: 'lq' } },
      { new: true }
    );
    const { created_at, updated_at } = user;
    assert(updated_at - created_at > 0);
  });

  it('can\'t find one', async function () {
    const user = await User.findOneAndUpdate(
      { name: 'liqiang' },
      { name: 'lq' },
      { new: true }
    );
    assert(user == null);
  });

  it('when can\'t find one then insert, created_at should equal updated_at', async function () {
    const user = await User.findOneAndUpdate(
      { name: 'liqiang' },
      { email: '974923609@qq.com' },
      { new: true, upsert: true }
    );
    const { created_at, updated_at } = user;
    assert(created_at - updated_at === 0);
  });

  it('findByIdAndUpdate', async function () {
    let user = await User.create({ name: 'liqiang', email: '974923609@qq.com' });
    await sleep();
    user = await User.findByIdAndUpdate(
      user._id,
      { name: 'lq' },
      { new: true }
    );
    const { created_at, updated_at } = user;
    assert(updated_at - created_at > 0);
  });
});

describe('customize fields\' name: update hook', async function () {

  afterEach(async function () {
    await User.remove({});
  });

  it('created_at should less than updated_at', async function () {
    let user = await User.create({ name: 'liqiang', email: '974923609@qq.com' });
    await sleep();
    await User.update(
      { name: 'liqiang' },
      { name: 'lq' }
    );
    user = await User.findById(user._id);
    const { created_at, updated_at } = user;
    assert(updated_at - created_at > 0);
  });

  it('update multi', async function () {
    let [user1, user2] = await User.create([
      { name: 'liqiang', email: '974923609@qq.com' },
      { name: 'lq', email: '974923609@qq.com' }
    ]);
    await sleep();
    await User.update(
      { email: '974923609@qq.com' },
      { name: 'lqq' },
      { multi: true }
    );
    user1 = await User.findById(user1._id);
    user2 = await User.findById(user2._id);
    assert(user1.updated_at - user1.created_at > 0 && user2.updated_at - user2.created_at > 0);
  });
});

describe('customize fields\' name: updateOne hook', async function () {

  afterEach(async function () {
    await User.remove({});
  });

  it('created_at should less than updated_at', async function () {
    let user = await User.create({ name: 'liqiang', email: '974923609@qq.com' });
    await sleep();
    await User.updateOne(
      { name: 'liqiang' },
      { name: 'lq' }
    );
    user = await User.findById(user._id);
    const { created_at, updated_at } = user;
    assert(updated_at - created_at > 0);
  });
});

describe('customize fields\' name: updateMany hook', async function () {

  afterEach(async function () {
    await User.remove({});
  });

  it('created_at should less than updated_at', async function () {
    let [user1, user2] = await User.create([
      { name: 'liqiang', email: '974923609@qq.com' },
      { name: 'lq', email: '974923609@qq.com' }
    ]);
    await sleep();
    await User.updateMany(
      { email: '974923609@qq.com' },
      { name: 'lqq' }
    );
    user1 = await User.findById(user1._id);
    user2 = await User.findById(user2._id);
    assert(user1.updated_at - user1.created_at > 0 && user2.updated_at - user2.created_at > 0);
  });
});

describe('customize fields\' name: insertMany hook', async function () {

  afterEach(async function () {
    await User.remove({});
  });

  it('the docs should have created_at and updated_at and should be equal', async function () {
    const [user1, user2] = await User.insertMany([
      { name: 'liqiang', email: '974923609@qq.com' },
      { name: 'lq', email: '974923609@qq.com' }
    ]);
    const isDate = user1.created_at instanceof Date && user1.updated_at instanceof Date;
    const isEqual = user1.created_at - user1.updated_at === 0 && user2.created_at - user2.updated_at === 0 && user1.created_at - user2.created_at === 0;
    assert(isDate && isEqual);
  });
});
