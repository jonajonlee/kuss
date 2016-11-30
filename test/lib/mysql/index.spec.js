/*eslint-env node, mocha*/
/* eslint no-magic-numbers: 0 */
/* eslint 'max-len': [ 'error', 200 ] */

const { expect } = require('chai')

const MySqlStore = require('../../../lib/mysql')
const Err        = require('../../../lib/error')

describe('lib/mysql', function() {

  let mysql = null
  let store = null

  beforeEach(function() {
    mysql = {
      query: null
      , escapeId: (x) => `\`${x}\``
      , escape: (x) => `'${x}'`
    }
    store = MySqlStore(mysql)
  })




  describe('::insert', function() {


    it('should execute an insert query on the given table', function() {

      const table     = 'test'
      const params    = { foo: 'bar', bar: 'baz' }
      const sql_regex = /^INSERT INTO `test` SET \? -- [a-f0-9]{29}/

      mysql.query = (actual_sql, actual_params, cb) => {

        expect(actual_sql).to.match(sql_regex)
        expect(actual_params).to.deep.eql(params)

        cb(null, { insertId: '1234' })

      }

      return store.insert(table, params).then((result) => {

        expect(result).to.eql('1234')

      })

    })

  })


  describe('::update', function() {


    it('should execute an update query on the given table', function() {

      const table     = 'test'
      const params    = { foo: 'bar', bar: 'baz' }
      const id        = '4321'
      const sql_regex = /^UPDATE `test` SET .*/

      mysql.query = (actual_sql, actual_params, cb) => {
        expect(actual_sql).to.match(sql_regex)
        expect(actual_params).to.deep.eql([params, id])
        cb(null, { affectedRows: 1 })
      }

      return store.update(table, id, params).then((result) => {
        expect(result).to.eql(id)
      })
    })

    it(`should throw a NotFound error if you try to update a non-existant
      document`, function() {

      const table     = 'test'
      const params    = { foo: 'bar', bar: 'baz' }
      const id        = '4321'
      const sql_regex = /^UPDATE `test` SET .*/

      mysql.query = (actual_sql, actual_params, cb) => {
        expect(actual_sql).to.match(sql_regex)
        expect(actual_params).to.deep.eql([params, id])
        cb(null, { affectedRows: 0 })
      }

      return store.update(table, id, params)
      .then((result) => { expect(result).to.eql(id) })
      .catch(Err.NotFound, e => { expect(e.status).eql(404) })
      .catch(() => { throw new Error('wtf something failed!') })
    })
  })


  describe('::updateWhereEq', function() {

    it('should execute an updateWhereEq query on the given table', function() {

      const table     = 'test'
      const updates   = { foo: 'bar', bar: 'baz' }
      const predicate = { foo : 1, bar : null, one : 'one' }
      const sql_regex = /^UPDATE `test` SET \? WHERE `foo` = 1 AND `bar` IS NULL AND `one` = \'one\' .*/

      mysql.query = (actual_sql, actual_updates, cb) => {
        expect(actual_sql).to.match(sql_regex)
        expect(actual_updates).to.deep.equal([updates])
        cb(null, { affectedRows: 3 })
      }

      return store.updateWhereEq(table)(predicate)(updates)
      .then(result => {
        expect(result).to.eql(3)
      })
    })
  })


  describe('::findWhereEq', function() {

    it('should execute a select query on the given table', function() {

      const table = 'post_archive'

      const request = {
        projection : ['id', 'traversal_id', 'network_type_code']
      , predicates : { stored_es : 1479439176, deleted : 0 }
      , sort       : [ { id : 'desc' } ]
      , skip       : 2
      , limit      : 3
      }

      const select_regex = /SELECT `id`, `traversal_id`, `network_type_code`/
      const where_regex  = /WHERE `stored_es` = 1479439176 AND `deleted` = 0/
      const sort_regex   = /ORDER BY `id` desc/
      const offset_regex = /OFFSET 2/
      const limit_regex  = /LIMIT 3/

      mysql.query = (actual_sql, actual_updates, cb) => {
        expect(actual_sql).to.match(select_regex)
        expect(actual_sql).to.match(where_regex)
        expect(actual_sql).to.match(sort_regex)
        expect(actual_sql).to.match(offset_regex)
        expect(actual_sql).to.match(limit_regex)
        cb(null, [])
      }

      return store.findWhereEq(table, request)
      .then(result => {
        expect(result).to.eql([])
      })
    })

    it('should execute a select query without sort', function() {

      const table = 'post_archive'

      const request = {
        projection : ['id', 'traversal_id', 'network_type_code']
      , predicates : { stored_es : 1479439176, deleted : 0 }
      , skip       : 2
      , limit      : 3
      }

      const select_regex = /SELECT `id`, `traversal_id`, `network_type_code`/
      const where_regex  = /WHERE `stored_es` = 1479439176 AND `deleted` = 0/
      const sort_regex   = /ORDER BY `id` desc/
      const offset_regex = /OFFSET 2/
      const limit_regex  = /LIMIT 3/


      mysql.query = (actual_sql, actual_updates, cb) => {
        expect(actual_sql).to.match(select_regex)
        expect(actual_sql).to.match(where_regex)
        expect(actual_sql).to.not.match(sort_regex)
        expect(actual_sql).to.match(offset_regex)
        expect(actual_sql).to.match(limit_regex)
        cb(null, [])
      }

      return store.findWhereEq(table, request)
      .then(result => {
        expect(result).to.eql([])
      })
    })

    it('should execute a select query without pagination', function() {

      const table = 'post_archive'

      const request = {
        projection : ['id', 'traversal_id', 'network_type_code']
      , predicates : { stored_es : 1479439176, deleted : 0 }
      , sort       : [ { id : 'desc' } ]
      }

      const select_regex = /SELECT `id`, `traversal_id`, `network_type_code`/
      const where_regex  = /WHERE `stored_es` = 1479439176 AND `deleted` = 0/
      const sort_regex   = /ORDER BY `id` desc/
      const offset_regex = /OFFSET 2/
      const limit_regex  = /LIMIT 3/


      mysql.query = (actual_sql, actual_updates, cb) => {
        expect(actual_sql).to.match(select_regex)
        expect(actual_sql).to.match(where_regex)
        expect(actual_sql).to.match(sort_regex)
        expect(actual_sql).to.not.match(offset_regex)
        expect(actual_sql).to.not.match(limit_regex)
        cb(null, [])
      }

      return store.findWhereEq(table, request)
      .then(result => {
        expect(result).to.eql([])
      })
    })

    it('should execute a select query with a multi ORDER BY', function() {

      const table = 'post_archive'

      const request = {
        projection : ['id', 'traversal_id', 'network_type_code']
      , predicates : { stored_es : 1479439176, deleted : 0 }
      , sort       : [ { id : 'desc' }, { priority : 'asc' } ]
      }

      const select_regex = /SELECT `id`, `traversal_id`, `network_type_code`/
      const where_regex  = /WHERE `stored_es` = 1479439176 AND `deleted` = 0/
      const sort_regex   = /ORDER BY `id` desc, `priority` asc/
      const offset_regex = /OFFSET 2/
      const limit_regex  = /LIMIT 3/

      mysql.query = (actual_sql, actual_updates, cb) => {
        expect(actual_sql).to.match(select_regex)
        expect(actual_sql).to.match(where_regex)
        expect(actual_sql).to.match(sort_regex)
        expect(actual_sql).to.not.match(offset_regex)
        expect(actual_sql).to.not.match(limit_regex)
        cb(null, [])
      }

      return store.findWhereEq(table, request)
      .then(result => {
        expect(result).to.eql([])
      })
    })

  })

  describe('::upsert', function() {


    it('should execute an upsert query on the given table', function() {

      const table  = 'test'
      const params = { foo: 'bar', bar: 'baz', baz: 'boo' }
      const props  = [ 'baz', 'foo' ]
      const sql_regex = new RegExp(
        "^INSERT INTO `test` SET \\? " +
        "ON DUPLICATE KEY UPDATE " +
        "`baz`=VALUES\\(`baz`\\), `foo`=VALUES\\(`foo`\\) " +
                            "-- [a-f0-9]{29}"
      )

      mysql.query = (actual_sql, actual_params, cb) => {

        expect(actual_sql).to.match(sql_regex)
        expect(actual_params).to.deep.eql(params)

        cb(null, { insertId: '1234' })

      }


      return store.upsert(table, props, params).then((result) => {

        expect(result).to.eql('1234')

      })

    })


  })


  describe('::getById', function() {


    it('should select * by identifier from the given table',
      function() {

        const table        = 'test'
        const expected_sql = 'SELECT * FROM `test` WHERE `id` = ? '
        const params       = [ '1234' ]

        mysql.query = (actual_sql, actual_params, cb) => {

          expect(actual_sql).to.eql(expected_sql)
          expect(actual_params).to.deep.eql(params)

          cb(null, [ { test: 'pass' } ])
        }

        return store.getById(table, params[0]).then((result) => {

          expect(result.test).to.eql('pass')

        })

      })


  })


  describe('::getAll', function() {


    it('should select * from the given table', function() {

      const table = 'test'
      const expected_sql = 'SELECT * FROM `test`'

      mysql.query = (actual_sql, actual_params, cb) => {

        expect(actual_sql).to.eql(expected_sql)
        expect(actual_params).to.deep.eql([])

        cb(null, [ { test: 'pass' } ])
      }

      return store.getAll(table).then((result) => {
        expect(result[0].test).to.eql('pass')
      })

    })


  })


  describe('::projectAll', function() {


    it('should execute a non filtered projection', function() {

      const table      = 'test'
      const projection = [ 'foo' , 'bar' ]
      const expected_sql = ' SELECT `foo`, `bar` FROM `test`'

      mysql.query = (actual_sql, actual_params, cb) => {

        expect(actual_sql).to.eql(expected_sql)
        expect(actual_params).to.deep.eql([])

        cb(null, [ { test: 'pass' } ])
      }
      return store.projectAll(table, projection).then((result) => {
        expect(result[0].test).to.eql('pass')
      })

    })


  })


  describe('::findBy', function() {


    it('should executed a filtered projection', function() {

      const table        = 'test'
      const projection   = [ 'foo' , 'bar' ]
      const params       = [ 'run away, run away' ]
      const expected_sql = ' SELECT `foo`, `bar`'
        + ' FROM `test`'
        + ' WHERE `foo` = ? '
      

      mysql.query = (actual_sql, actual_params, cb) => {

        expect(actual_sql).to.eql(expected_sql)
        expect(actual_params).to.deep.eql(params)

        cb(null, [ { test: 'pass' } ])
      }

      return store.findBy(table, projection, projection[0], params[0])

        .then((result) => {
          expect(result[0].test).to.eql('pass')
        })


    })

  })


  describe('::findById', function() {


    it('should execute a projection filtered by identifier and ' +
      'return the first item', function() {

        const table        = 'test'
        const projection   = [ 'id', 'foo' , 'bar' ]
        const params       = '1234'
        const expected_sql = ' SELECT `id`, `foo`, `bar`'
          + ' FROM `test`'
          + ' WHERE `id` = ? '


        mysql.query = (actual_sql, actual_params, cb) => {

          expect(actual_sql).to.eql(expected_sql)
          expect(actual_params).to.deep.eql([ '1234' ])

          cb(null, [ { test: 'pass' } ])
        }

        return store.findById(table, projection, params)

          .then((result) => {
            expect(result.test).to.eql('pass')
          })

      })

  })


  describe('::findOneBy', function() {


    it('should executed a filtered projection and return the first item',
      function() {

        const table        = 'test'
        const projection   = [ 'foo' , 'bar' ]
        const params       = [ 'run away, run away' ]
        const expected_sql = ' SELECT `foo`, `bar`'
          + ' FROM `test`'
          + ' WHERE `foo` = ? '


        mysql.query = (actual_sql, actual_params, cb) => {

          expect(actual_sql).to.eql(expected_sql)
          expect(actual_params).to.deep.eql(params)

          cb(null, [ { test: 'pass' } ])
        }

        return store.findOneBy(table, projection, projection[0], params[0])

          .then((result) => {
            expect(result.test).to.eql('pass')
          })

      })


    it('should throw an error if the query returns more than one item',
      function() {

        const table        = 'test'
        const projection   = [ 'foo' , 'bar' ]
        const params       = [ 'run away, run away' ]
        const expected_sql = ' SELECT `foo`, `bar`'
          + ' FROM `test`'
          + ' WHERE `foo` = ? '


        mysql.query = (actual_sql, actual_params, cb) => {

          expect(actual_sql).to.eql(expected_sql)
          expect(actual_params).to.deep.eql(params)

          cb(null, [ { test: 'pass' }, { test: 'fail' } ])
        }

        return store.findOneBy(table, projection, projection[0], params[0])

          .then(() => { throw new Error('Unexpected success') })

          .catch((e) => {
            if (e.name === 'AssertionError') throw e

            expect(e.name).to.eql('TooManyRecords')
            expect(e.message).to.eql(
              'Too many records. ' +
              'Found 2 records in `test` ' +
              'where `foo` = "run away, run away"'
            )

          })

      })


  })

})
