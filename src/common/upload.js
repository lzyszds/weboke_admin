const multer = require('multer')
const mime = require('mime')

//允许存储的文件类型
const allowImgType = [
  'image/jpg',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
]

var storage_path = './public/img/upload'

//文件存储位置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, storage_path)
  },
  filename: function (req, file, cb) {
    if (allowImgType.includes(file.mimetype)) {
      const imgtype = mime.getExtension(file.mimetype)
      suffix = Date.now() + '.' + imgtype
      cb(null, file.fieldname + suffix)
    } else {
      cb('当前文件暂不支持上传,暂时只支持jpg.jpeg,png,gif,bmp,webp,svg,icon等图标。')
    }
  }
})

/* 
  multer文档地址
  https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md
*/
const limits = {
  fileSize: 1024 * 1024 * 2, //1024字节=1kb  1024kb=1MB 
  files: 1,//一次上传一张
}
const ArticleSizelimit = {
  fileSize: 1024 * 1024 * 2, //1024字节=1kb  1024kb=1MB 
  files: 1,//一次上传一张
}


const multerUp = multer({ storage, limits, }).single('headImg')
storage_path = './public/img/articleImages'
const ArticleUp = multer({ storage, ArticleSizelimit, }).single('upload-image')

const upload = (req, res, next) => {
  multerUp(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.send({ code: 500, message: '文件大小超出2MB,请重新选择！1' })
    } else if (err) {
      return res.send({ code: 500, message: err })
    }
    const path = req.file.path.replace(/\\/g, '/')
    return res.send({ code: 200, message: '/' + path })
  })
}
const uploadArticleImg = (req, res, next) => {
  ArticleUp(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.send({ code: 500, message: '文件大小超出10MB,请重新选择！1' })
    } else if (err) {
      return res.send({ code: 500, message: err })
    }
    const path = req.file.path.replace(/\\/g, '/')
    return res.send({ code: 200, message: '/' + path })
  })
}
module.exports = {
  upload,
  uploadArticleImg
}
