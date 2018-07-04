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
UserSchema.plugin(timePlugin);
const User = mongoose.model('User', UserSchema);

function sleep() {
  return new Promise(resolve => {
    setTimeout(resolve, 1);
  });
}

after(function () {
  mongoose.close();
});

describe('save hook', function() {

  afterEach(async function() {
    await User.remove({});
  });

  it('the doc should have createdAt and updatedAt', async function() {
    const user = new User({ name: 'liqiang', email: '974923609@qq.com' });
    await user.save();
    const savedUser = await User.findById(user._id);
    const { createdAt, updatedAt } = savedUser;
    assert(createdAt instanceof Date && updatedAt instanceof Date);
  });

  it('when new, createdAt should equal updatedAt', async function() {
    const user = new User({ name: 'liqiang', email: '974923609@qq.com' });
    await user.save();
    const savedUser = await User.findById(user._id);
    const { createdAt, updatedAt } = savedUser;
    assert(createdAt - updatedAt === 0);
  });

  it('when modify, createdAt should less than updatedAt', async function() {
    const user = new User({ name: 'liqiang', email: '974923609@qq.com' });
    await user.save();
    user.name = 'lq';
    await sleep();
    await user.save();
    const savedUser = await User.findById(user._id);
    const { createdAt, updatedAt } = savedUser;
    assert(updatedAt - createdAt > 0);
  });

  it('use Model.create()', async function() {
    const user = await User.create({ name: 'liqiang', email: '974923609@qq.com' });
    const { createdAt, updatedAt } = user;
    assert(createdAt - updatedAt === 0);
  });
});

describe('findOneAndUpdate hook', async function() {

  afterEach(async function () {
    await User.remove({});
  });

  it('createdAt should less than updatedAt', async function() {
    await User.create({ name: 'liqiang', email: '974923609@qq.com' });
    await sleep();
    const user = await User.findOneAndUpdate(
      { name: 'liqiang' },
      { name: 'lq' },
      { new: true }
    );
    const { createdAt, updatedAt } = user;
    assert(updatedAt - createdAt > 0);
  });

  it('when use $set', async function() {
    await User.create({ name: 'liqiang', email: '974923609@qq.com' });
    await sleep();
    const user = await User.findOneAndUpdate(
      { name: 'liqiang' },
      { $set: { name: 'lq' } },
      { new: true }
    );
    const { createdAt, updatedAt } = user;
    assert(updatedAt - createdAt > 0);
  });

  it('can\'t find one', async function () {
    const user = await User.findOneAndUpdate(
      { name: 'liqiang' },
      { name: 'lq' },
      { new: true }
    );
    assert(user == null);
  });

  it('when can\'t find one then insert, createdAt should equal updatedAt', async function() {
    const user = await User.findOneAndUpdate(
      { name: 'liqiang' },
      { email: '974923609@qq.com' },
      { new: true, upsert: true }
    );
    const { createdAt, updatedAt } = user;
    assert(createdAt - updatedAt === 0);
  });

  it('findByIdAndUpdate', async function() {
    let user = await User.create({ name: 'liqiang', email: '974923609@qq.com' });
    await sleep();
    user = await User.findByIdAndUpdate(
      user._id,
      { name: 'lq' },
      { new: true }
    );
    const { createdAt, updatedAt } = user;
    assert(updatedAt - createdAt > 0);
  });
});

describe('update hook', async function() {

  afterEach(async function () {
    await User.remove({});
  });

  it('createdAt should less than updatedAt', async function () {
    let user = await User.create({ name: 'liqiang', email: '974923609@qq.com' });
    await sleep();
    await User.update(
      { name: 'liqiang' },
      { name: 'lq' }
    );
    user = await User.findById(user._id);
    const { createdAt, updatedAt } = user;
    assert(updatedAt - createdAt > 0);
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
    assert(user1.updatedAt - user1.createdAt > 0 && user2.updatedAt - user2.createdAt > 0);
  });
});

describe('updateOne hook', async function() {

  afterEach(async function() {
    await User.remove({});
  });

  it('createdAt should less than updatedAt', async function() {
    let user = await User.create({ name: 'liqiang', email: '974923609@qq.com' });
    await sleep();
    await User.updateOne(
      { name: 'liqiang' },
      { name: 'lq' }
    );
    user = await User.findById(user._id);
    const { createdAt, updatedAt } = user;
    assert(updatedAt - createdAt > 0);
  });
});

describe('updateMany hook', async function () {

  afterEach(async function () {
    await User.remove({});
  });

  it('createdAt should less than updatedAt', async function () {
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
    assert(user1.updatedAt - user1.createdAt > 0 && user2.updatedAt - user2.createdAt > 0);
  });
});

describe('insertMany hook', async function () {

  afterEach(async function () {
    await User.remove({});
  });

  it('the docs should have createdAt and updatedAt and should be equal', async function () {
    const [user1, user2] = await User.insertMany([
      { name: 'liqiang', email: '974923609@qq.com' },
      { name: 'lq', email: '974923609@qq.com' }
    ]);
    const isDate = user1.createdAt instanceof Date && user1.updatedAt instanceof Date;
    const isEqual = user1.createdAt - user1.updatedAt === 0 && user2.createdAt - user2.updatedAt === 0 && user1.createdAt - user2.createdAt === 0;
    assert(isDate && isEqual);
  });
});
