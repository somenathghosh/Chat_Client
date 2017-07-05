'use strict';

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './upload');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.fieldname + path.extname(file.originalname));
  },
});


/**
 * [description]
 * @method
 * @param   {[type]}   req  [description]
 * @param   {[type]}   file [description]
 * @param   {Function} cb   [description]
 * @return  {[type]}        [description]
 * This is a function
 * @author Somenath Ghosh
 * @version [version]
 * @date    2017-07-04
 */
const fileFilter = function(req, file, cb) {
  console.log('file name being uploaded', file.originalname);
  let fileName = file.originalname.toLowerCase();
  if (!fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

module.exports = multer({storage: storage, fileFilter: fileFilter, limits: {filesize: 5*1024*1024, files: 9}});
