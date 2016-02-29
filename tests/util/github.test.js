var Github = require('../../lib/util/github')
var chai = require('chai')
var expect = chai.expect

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

describe('Github', () => {
  it('It should get all the organizers', () => {
    const adminRepo = {
      'name': 'admin-maintainer',
      'slug': 'admin-maintainer',
      'description': 'Maintains the nodeschool-admin CLI',
      'repos': [{
        'name': 'admin',
        'full_name': 'nodeschool/admin',
        'created_at': '2016-01-18T15:52:01Z',
        'description': 'CLI tool for setting up and maintaining a nodeschool chapters and other things.',
        'fork': false,
        'homepage': null,
        'html_url': 'https://github.com/nodeschool/admin',
        'default_branch': 'master'
      }],
      'members': [{
        'login': 'dinodsaurus',
        'name': 'Dino Trojak',
        'avatar_url': 'https://avatars.githubusercontent.com/u/1530952?v=3'
      }, {
        'login': 'fforres',
        'name': 'Felipe Torres (fforres)',
        'avatar_url': 'https://avatars.githubusercontent.com/u/952992?v=3'
      }, {
        'login': 'martinheidegger',
        'name': 'Martin Heidegger',
        'avatar_url': 'https://avatars.githubusercontent.com/u/914122?v=3'
      }, {
        'login': 'SomeoneWeird',
        'name': 'Adam Brady',
        'avatar_url': 'https://avatars.githubusercontent.com/u/665754?v=3'
      }]
    }
    return expect(Github.getOrganizers()).to.eventually.contain(adminRepo)
  })
})
