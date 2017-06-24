'use strict';

const multer = require('multer');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './upload');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now()+'-'+file.fieldname);
  },
});


/**
 * @param  {} req
 * @param  {} file
 * @param  {} cb
 */
const fileFilter = function(req, file, cb) {
 if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

module.exports = multer({storage: storage, fileFilter: fileFilter, limits: {filesize: 5*1024*1024, files: 9}});

