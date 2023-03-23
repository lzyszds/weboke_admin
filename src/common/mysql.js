const mysql = require('mysql')
const { aesDecrypt } = require('./crypto')


/* 
  name 当前sql表的表名
  attr 当前sql表的主键 一般都是当前表的id
*/
const deleteSql = (name, attr) => {
  let sql = `ALTER TABLE ${name} DROP ${attr};`
  sql += `ALTER TABLE ${name} ADD ${attr} int NOT NULL FIRST;`
  sql += `ALTER TABLE ${name} MODIFY COLUMN ${attr} int NOT NULL AUTO_INCREMENT , ADD PRIMARY KEY(${attr});`
  return sql
}

const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'lzy_admin'
})

connection.connect()

module.exports = {
  query: (sqlTxt, req, res) => {
    if (req && res) {
      const authorization = req.rawHeaders[req.rawHeaders.indexOf('authorization') + 1]
      const token = aesDecrypt(authorization, 'lzyszds')
      const tokenSqlTxt = `select * from USERLIST where token = '${token}'`
      connection.query(tokenSqlTxt, (err, result) => {
        if (err) return res.send({ code: 10011, message: 'token失效,请重新登陆' })
      })
    }
    const data = new Promise((resolve, reject) => {
      connection.query(sqlTxt, (err, result) => {
        if (err) return reject(err)
        resolve(result)
      })
    })
    // connection.end()
    return data
  },
  deleteSql
}
