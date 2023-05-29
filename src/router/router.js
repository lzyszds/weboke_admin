const express = require('express')
const router = express.Router()
const { query, deleteSql } = require('../common/mysql')
const { upload, uploadArticleImg } = require('../common/upload')
const { aesEncrypt, aesDecrypt } = require('../common/crypto')
const nowDate = Math.floor(Date.now() / 1000); //当前时间的时间戳


//登陆验证`
router.post('/login', (req, res) => {
  const { username, password } = req.body
  UserName = username
  const sqlTxt = `
    select token from USERLIST
    where username="${username}" and password = "${password}"
  `
  query(sqlTxt, req, res).then((data) => {
    if (data.length === 0) return res.send({ code: 204, message: '账号密码不存在' })
    res.send({ code: 200, token: aesEncrypt(data[0].token, 'lzyszds') })
  })

})

//发布评论
router.post('/addComment', (req, res) => {
  const imgs = [
    'http://localhost:1027/public/img/comments/NO.0001.jpg',
    'http://localhost:1027/public/img/comments/NO.0002.jpg',
    'http://localhost:1027/public/img/comments/NO.0003.jpg',
    'http://localhost:1027/public/img/comments/NO.0004.jpg',
    'http://localhost:1027/public/img/comments/NO.0005.jpg',
    'http://localhost:1027/public/img/comments/NO.0006.jpg',
    'http://localhost:1027/public/img/comments/NO.0007.jpg',
    'http://localhost:1027/public/img/comments/NO.0008.jpg',
    'http://localhost:1027/public/img/comments/NO.0009.jpg',
    'http://localhost:1027/public/img/comments/NO.0010.jpg',
    'http://localhost:1027/public/img/comments/NO.0011.jpg',
    'http://localhost:1027/public/img/comments/NO.0012.jpg',
  ]
  console.log(`lzy  nowDate:`, nowDate)

  const { content, aid, replyId, groundId, email, name, userIp, imgIndex } = req.body
  const sqlTxt = `
    insert into wcomment(content, article_id, reply_id,ground_id, email, user_name,user_ip,time,head_img)
    values('${content}', '${aid}', '${replyId}','${groundId}', '${email}', '${name}', '${userIp}','${nowDate}','${imgs[imgIndex]}')
  `
  query(sqlTxt, req, res).then((data) => {
    res.send({ code: 200, message: '评论成功' })
  })
})

//获取某一文章评论
router.get('/getComment', (req, res) => {
  const aid = req.query.aid
  const sqlTxt = `
    select * from wcomment
    where article_id = ${aid}
  `
  query(sqlTxt, req, res).then((data) => {
    let arr = []
    //处理二级评论数据，将二级评论放到对应的一级评论的reply属性中
    const levelOne = data.filter(item => item.reply_id == 0)
    const levelTow = data.filter(item => item.reply_id != 0)
    levelOne.forEach(element => {
      arr.push(element)
    })
    levelTow.forEach(element => {
      levelOne.forEach(item => {
        data.forEach(res => {
          if (res.comId === element.reply_id) {
            element.replyPeople = res.user_name
          }
        })
        //将二级评论放到对应的一级评论的reply属性中
        if (item.comId === element.ground_id) {
          if (!item.reply) item.reply = []
          item.reply.push(element)
        }
      })
    })
    res.send({ code: 200, data: arr })
  })
})

//获取评论表所有内容
router.get('/getComments', (req, res) => {
  const sqlTxt = ` select * from wcomment `
  query(sqlTxt, req, res).then((data) => {
    res.send({ code: 200, data: data })
  }).catch((err) => {
    res.send({ code: 500, msg: 'Server error' })
  })
})
//删除评论
router.post('/deleteComment', async (req, res) => {
  const { comId } = req.body
  const item = await query(`select * from wcomment where comId = ${comId}`, req, res)
  //判断当前评论是否有子评论，如果有子评论，一并删除
  if (item[0].ground_id === 0) {
    const sqlTxt = `select * from wcomment where ground_id = ${comId} or comId = ${comId}`
    const data = await query(sqlTxt, req, res)
    const ids = data.map(itemCl => itemCl.comId)
    const delSql = `delete from wcomment where comId in (${ids})`
    query(delSql, req, res).then(data => {
      res.send({ code: 200, message: '删除成功' })
    })
  } else {
    const delSql = `delete from wcomment where comId = ${comId}`
    query(delSql, req, res).then(data => {
      res.send({ code: 200, message: '删除成功' })
    })
  }
})

//新增用户账号
router.post('/addUserLzy', (req, res) => {
  const para = req.body
  const sqlTxt = `insert into USERLIST(uname,username, password, token,power,createDate,lastLoginDate,headImg,isUse) 
  values('${para.name}', '${para.username}', '${para.password}','
  ${para.token}','${para.power}', '${para.date}', '
  ${para.date}','${para.setHeadImg}','true')`
  query(sqlTxt, req, res).then(data => {
    res.send({ code: 200, message: '添加成功' })
  }).catch(err => { res.send({ code: 204, message: '添加失败', err: err }) })
})

//删除用户账号
router.post('/deleteUserLzy', (req, res) => {
  const para = req.body
  let sqlTxt = `DELETE FROM USERLIST WHERE uid=${para.id};`
  query(sqlTxt, req, res).then(item => {
    res.send({ code: 200, message: '删除成功' })
    sqlTxt = `ALTER TABLE USERLIST AUTO_INCREMENT=1001;`
    query(sqlTxt)
  }).catch(err => { res.send({ code: 204, message: '删除失败', err: err }) })
})

//获取用户列表
router.get('/userList', (req, res) => {

  const authorization = req.rawHeaders[req.rawHeaders.indexOf('authorization') + 1]
  const token = aesDecrypt(authorization, 'lzyszds')
  const tokenSqlTxt = `select * from USERLIST where token = '${token}'`
  query(tokenSqlTxt).then(item => {
    if (item.length === 0) return res.send({ code: 10011, message: 'token失效,请重新登陆' })
    const pages = req.query.pages
    const limit = req.query.limit //限制每次返回多少条数据
    //如果当前用户是超级管理员(admin)，就返回所有用户列表，否则只返回当前用户级别的用户列表
    let sqlTxt = `select * from USERLIST`
    if (item[0].power !== 'admin') sqlTxt = `select * from USERLIST where power = "${item[0].power}"`
    // 查询当前用户权限允许的用户列表
    query(sqlTxt).then(data => {
      const total = data.length
      if (total === 0) return res.send({ code: 204, message: '未知错误' })
      data = data.slice((pages - 1) * limit, pages * limit)
      res.send({ code: 200, data: data, total: total })
    })
  })

})
//修改用户账号
router.post('/updateUserLzy', (req, res) => {
  const para = req.body
  const sqlTxt = `UPDATE USERLIST SET uname='${para.name}',username='${para.username}',password='${para.password}', headImg='${para.setHeadImg}' WHERE uid='${para.uid}' `
  query(sqlTxt, req, res).then(item => {
    res.send({ code: 200, message: '修改成功' })
  }).catch(err => { res.send({ code: 204, message: '修改失败', err: err }) })
})

//上传用户头像
router.post('/uploadHead', upload, (req, res) => { })

//获取用户详情
router.get('/getUserInfo', (req, res) => {
  const authorization = req.rawHeaders[req.rawHeaders.indexOf('authorization') + 1]
  const token = aesDecrypt(authorization, 'lzyszds')
  const tokenSqlTxt = `select * from USERLIST where token = '${token}'`
  query(tokenSqlTxt).then(item => {
    if (item.length === 0) return res.send({ code: 10011, message: 'token失效,请重新登陆' })
    res.send({ code: 200, data: item[0] })
  })
})

//搜索用户
router.get('/searchUser', (req, res) => {
  console.log(123);
  // const pages = req.query.pages
  // const limit = req.query.limit //限制每次返回多少条数据
  const search = req.query.search
  const sqlTxt = `
    select * from USERLIST
    where uname like '%${search}%' or username like '%${search}%' or
    perSign like '%${search}%' or power like '%${search}%' or
    uid like '%${search}%'
  `
  query(sqlTxt, req, res).then(data => {
    const total = data.length
    if (total === 0) return res.send({ code: 204, data, message: '暂无内容' })
    // data = data.slice(0, 9)
    res.send({ code: 200, data: data, total: total })
  })
})

//查询文章列表
router.get('/articleList', async (req, res) => {
  const pages = req.query.pages //当前页数
  const limit = req.query.limit //限制每次返回多少条数据
  const sqlTxt = `select * from articlelist order by aid desc limit ${(pages - 1) * limit},${pages * limit}`
  //文章表总记录数对象
  const atcSizeObj = await query('select count(*) from articlelist', req, res)
  //文章表总记录数，解析对象
  const atcSize = Object.values(atcSizeObj[0])[0]

  //获取文章列表data
  const data = await query(sqlTxt, req, res)
  const total = data.length
  //如果没有数据，直接返回
  if (total === 0) return res.send({ code: 204, message: '未知错误' })

  //遍历所有文章，通过文章id来查询当前文章的评论数
  for (let key of data) {
    const _item = await query(`select count(*) from wcomment where article_id = ${key.aid}`, req, res)
    key.comNumber = Object.values(_item[0])[0]
  }
  res.send({ code: 200, data: data, total: atcSize })

})

//获取文章详情
router.get('/articleDetail', (req, res) => {
  const aid = req.query.aid
  const sqlTxt = `select * from articlelist where aid = ${aid}`
  query(sqlTxt, req, res).then(data => {
    if (data.length === 0) return res.send({ code: 204, message: '未知错误' })
    res.send({ code: 200, data: data[0] })
  })
})

//上传文章图片
router.post('/uploadArticleImg', uploadArticleImg, (req, res) => { })

//修改文章
router.post('/updateArticle', (req, res) => {
  const para = req.body
  para.main = para.main.replaceAll(/\\'/g, "'").replaceAll(/\'/g, "\'")
  para.content = para.content.replaceAll(/\\'/g, "'").replaceAll(/\'/g, "\\'")
  const sqlTxt = `UPDATE articlelist SET title='${para.title}',coverContent='${para.coverContent}',content='${para.content}',main='${para.main}', coverImg='${para.coverImg}', modified='${para.modified}', wtype='${para.wtype}' WHERE aid='${para.aid}' `
  query(sqlTxt, req, res).then(item => {
    res.send({ code: 200, message: '修改成功' })
  }).catch(err => { res.send({ code: 204, message: '修改失败', err: err }) })
})

//添加文章
router.post('/addArticle', (req, res) => {
  const para = req.body
  const sqlTxt = `INSERT INTO articlelist 
  (author,createTime,title,content,modified, main, coverImg,wtype)
  VALUES ('${para.author}', ${nowDate}, '${para.title}', '${para.content}', ${nowDate}, '${para.main}', '${para.coverImg}', '${para.wtype}')`
  query(sqlTxt, req, res).then(item => {
    res.send({ code: 200, message: '添加成功' })
  }).catch(err => { res.send({ code: 204, message: '添加失败', err: err }) })
})

//删除文章
router.post('/deleteArticle', (req, res) => {
  const para = req.body
  let sqlTxt = `DELETE FROM articlelist WHERE aid=${para.id};`
  query(sqlTxt, req, res).then(item => {
    res.send({ code: 200, message: '删除成功' })
  }).catch(err => { res.send({ code: 204, message: '删除失败', err: err }) })
})

//搜索文章
router.get('/searchArticle', (req, res) => {
  const search = req.query.search
  const sqlTxt = `
    select * from articlelist
    where title like '%${search}%' or content like '%${search}%' or
    main like '%${search}%' or author like '%${search}%' or
    aid like '%${search}%'
  `
  query(sqlTxt, req, res).then(data => {
    const total = data.length
    if (total === 0) return res.send({ code: 204, data, message: '暂无内容' })
    // data = data.slice(0, 9)
    res.send({ code: 200, data: data, total: total })
  })
})

//获取文章分类可选项
router.get('/articleType', (req, res) => {
  const sqlTxt = `select * from articleType`
  query(sqlTxt, req, res).then(data => {
    if (data.length === 0) return res.send({ code: 204, message: '未知错误' })
    res.send({ code: 200, data: data })
  })
})
//添加文章分类可选项
router.post('/addArticleType', (req, res) => {
  const para = req.body
  const sqlTxt = `INSERT INTO articletype(name,isUse) VALUES('${para.name}','true')`
  query(sqlTxt, req, res).then(data => {
    if (data.length === 0) return res.send({ code: 204, message: '未知错误' })
    res.send({ code: 200, data: data })
  })
})
module.exports = router
